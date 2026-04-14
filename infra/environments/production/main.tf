locals {
  admin_hostname                   = "admin.open-agency.io"
  api_hostname                     = "admin.open-agency.io"
  backend_service_domain_subdomain = "open-agency-backend-production"
  backend_service_name             = "open-agency-backend-production"
  canonical_server_url             = "https://${local.admin_hostname}"
  bucket_name                      = "open-agency-production-media"

  railway_contract = var.railway_enabled ? module.railway[0].backend_service_contract : {
    admin_hostname                = local.admin_hostname
    api_hostname                  = local.api_hostname
    backend_service_domain        = null
    backend_service_domain_suffix = null
    backend_service_name          = local.backend_service_name
    environment_id                = null
    environment_name              = "production"
    fallback_markers = {
      provider_auth = {
        status = "fallback_mode"
        reason = "Railway resources are disabled until Railway credentials and any required provider configuration are supplied."
        procedure = [
          "Set railway_enabled = true for production when Railway credentials are available.",
          "Provide RAILWAY_TOKEN (and workspace_id if needed) before planning managed Railway resources.",
        ]
      }
      postgres = {
        status = "managed_service"
        reason = "Production Postgres is managed as a dedicated Railway service when railway_enabled is true."
        procedure = [
          "Provide postgres_database_name, postgres_user, and postgres_password through the production env/CI variable contract.",
          "Use an external BACKEND_DATABASE_URL only for operator tasks that need a direct connection from outside Railway.",
        ]
      }
      serverless = {
        status = "manual_verification_required"
        reason = "The Railway Serverless/sleep toggle is not modelled by the chosen Terraform provider."
        procedure = [
          "After enabling managed Railway resources, verify the production backend remains a persistent service with Serverless disabled.",
        ]
      }
    }
    managed      = false
    project_id   = null
    project_name = var.railway_project_name
    postgres = {
      database_name          = var.postgres_database_name
      data_directory         = "/var/lib/postgresql/data/pgdata"
      service_id             = null
      service_name           = "postgres"
      volume_mount_path      = "/var/lib/postgresql"
      volume_name            = "postgres-data"
      variable_collection_id = null
    }
    public_environment = {
      NEXT_PUBLIC_SERVER_URL = local.canonical_server_url
      MARKETING_APP_BASE_URL = var.marketing_app_base_url
      COURSES_APP_BASE_URL   = var.courses_app_base_url
    }
    required_public_environment_names = ["NEXT_PUBLIC_SERVER_URL", "MARKETING_APP_BASE_URL", "COURSES_APP_BASE_URL"]
    required_secret_environment_names = ["PAYLOAD_SECRET", "CRON_SECRET", "PREVIEW_SECRET", "REVALIDATE_SECRET"]
    optional_environment_names        = ["REVALIDATE_TIMEOUT_MS"]
    secret_values_supplied_externally = true
    service_domain_subdomain          = local.backend_service_domain_subdomain
    service_domains = {
      admin = {
        dns_record_value = null
        domain           = local.admin_hostname
        host_label       = null
        id               = null
        zone             = null
      }
      api = {
        dns_record_value = null
        domain           = local.api_hostname
        host_label       = null
        id               = null
        zone             = null
      }
    }
    variable_collection_id = null
  }

  cloudflare_contract = var.cloudflare_dns_enabled && var.railway_enabled ? module.cloudflare[0].dns_contract : {
    api = {
      id            = null
      hostname      = local.api_hostname
      managed       = false
      proxied       = null
      record_type   = "CNAME"
      target        = local.railway_contract.service_domains.admin.dns_record_value
      target_source = "admin hostname /api route"
    }
    admin = {
      id            = null
      hostname      = local.admin_hostname
      managed       = false
      proxied       = null
      record_type   = "CNAME"
      target        = local.railway_contract.service_domains.admin.dns_record_value
      target_source = "railway_custom_domain.admin.dns_record_value"
    }
    zone_id   = var.cloudflare_zone_id
    zone_name = var.cloudflare_zone_name
    fallback_markers = {
      provider_auth = {
        status = "fallback_mode"
        reason = "Cloudflare DNS records are disabled until Cloudflare credentials and Railway-managed DNS targets are available."
        procedure = [
          "Set cloudflare_dns_enabled = true for production after Railway management is enabled and Cloudflare credentials are available.",
          "Provide CLOUDFLARE_API_TOKEN and either cloudflare_zone_id or a resolvable cloudflare_zone_name before planning managed DNS resources.",
        ]
      }
    }
  }

  r2_contract = var.r2_enabled ? module.r2[0].bucket_contract : {
    account_id  = var.cloudflare_account_id
    aws_region  = "auto"
    bucket_name = local.bucket_name
    bucket_id   = null
    fallback_markers = {
      provider_auth = {
        status = "fallback_mode"
        reason = "R2 resources are disabled until Cloudflare credentials and account details are supplied."
        procedure = [
          "Set r2_enabled = true for production when Cloudflare credentials are available.",
          "Provide CLOUDFLARE_API_TOKEN plus the production cloudflare_account_id before planning managed R2 resources.",
        ]
      }
      cors_and_lifecycle = {
        status = "manual_follow_up_required"
        reason = "Advanced R2 CORS and lifecycle settings require AWS-provider-compatible resources against the R2 S3 endpoint."
        procedure = [
          "Add AWS-provider-compatible R2 resources in a follow-up change if Payload media uploads require bucket-level CORS or lifecycle rules.",
        ]
      }
    }
    managed                           = false
    public_hostname                   = var.r2_public_hostname
    public_custom_domain              = var.r2_public_hostname
    s3_compatible_endpoint            = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
    secret_values_supplied_externally = true
    required_secret_variable_names    = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]
  }
}

module "railway" {
  count  = var.railway_enabled ? 1 : 0
  source = "../../modules/railway"

  admin_hostname               = local.admin_hostname
  api_hostname                 = local.api_hostname
  backend_optional_environment = var.backend_optional_environment
  backend_public_environment = {
    NEXT_PUBLIC_SERVER_URL = local.canonical_server_url
    MARKETING_APP_BASE_URL = var.marketing_app_base_url
    COURSES_APP_BASE_URL   = var.courses_app_base_url
  }
  backend_secret_environment       = var.backend_secret_environment
  backend_service_domain_subdomain = local.backend_service_domain_subdomain
  backend_service_name             = local.backend_service_name
  environment_name                 = "production"
  postgres_database_name           = var.postgres_database_name
  postgres_data_directory          = "/var/lib/postgresql/data/pgdata"
  postgres_password                = var.postgres_password
  postgres_user                    = var.postgres_user
  project_description              = "Open Agency production backend infrastructure."
  project_name                     = var.railway_project_name
}

module "cloudflare" {
  count  = var.cloudflare_dns_enabled && var.railway_enabled ? 1 : 0
  source = "../../modules/cloudflare"

  dns_targets = {
    admin = local.railway_contract.service_domains.admin.dns_record_value
    api   = local.railway_contract.service_domains.api.dns_record_value
  }

  managed_hostnames = {
    admin = local.admin_hostname
    api   = local.api_hostname
  }
  zone_id   = var.cloudflare_zone_id
  zone_name = var.cloudflare_zone_name
}

module "r2" {
  count  = var.r2_enabled ? 1 : 0
  source = "../../modules/r2"

  account_id      = var.cloudflare_account_id
  bucket_name     = local.bucket_name
  public_hostname = var.r2_public_hostname
  zone_id         = var.cloudflare_zone_id
  zone_name       = var.cloudflare_zone_name
}

output "environment_contract" {
  description = "Production root-module composition for Railway, Cloudflare, and R2 resources plus explicit provider-gap fallbacks."
  value = {
    environment = "production"
    hostnames = {
      admin = local.admin_hostname
      api   = local.api_hostname
    }
    routing = {
      canonical_backend_url = local.canonical_server_url
      api_hostname_alias    = local.admin_hostname
    }
    backend_environment_variables = {
      public                = local.railway_contract.public_environment
      required_public_names = local.railway_contract.required_public_environment_names
      required_secret_names = local.railway_contract.required_secret_environment_names
      optional_names        = local.railway_contract.optional_environment_names
    }
    composition_mode = {
      cloudflare_dns = var.cloudflare_dns_enabled ? "managed" : "fallback"
      r2             = var.r2_enabled ? "managed" : "fallback"
      railway        = var.railway_enabled ? "managed" : "fallback"
    }
    cloudflare = local.cloudflare_contract
    r2         = local.r2_contract
    railway    = local.railway_contract
  }
}

output "database_url" {
  description = "Production database connection URL for backend runtime. Null if Railway resources are disabled."
  value       = var.railway_enabled ? module.railway[0].database_url : null
  sensitive   = true
}
