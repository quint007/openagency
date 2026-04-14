terraform {
  required_providers {
    railway = {
      source = "terraform-community-providers/railway"
    }
  }
}

locals {
  managed_database_url = format(
    "postgresql://%s:%s@%s.railway.internal:5432/%s",
    var.postgres_user,
    urlencode(var.postgres_password),
    var.postgres_service_name,
    var.postgres_database_name,
  )

  backend_environment = merge(
    var.backend_public_environment,
    merge(var.backend_secret_environment, {
      DATABASE_URL = local.managed_database_url
    }),
    {
      for key, value in var.backend_optional_environment : key => value
      if value != null
    },
  )

  required_secret_environment_variable_names = [
    "PAYLOAD_SECRET",
    "CRON_SECRET",
    "PREVIEW_SECRET",
    "REVALIDATE_SECRET",
  ]

  required_public_environment_variable_names = [
    "NEXT_PUBLIC_SERVER_URL",
    "MARKETING_APP_BASE_URL",
    "COURSES_APP_BASE_URL",
  ]

  optional_environment_variable_names = [
    "REVALIDATE_TIMEOUT_MS",
  ]

  fallback_markers = {
    provider_auth = {
      status = var.enabled ? "configured" : "fallback_mode"
      reason = var.enabled ? "Railway resource management is enabled for this environment." : "Railway resources are disabled until Railway credentials and any required provider configuration are supplied."
      procedure = var.enabled ? [] : [
        "Set railway_enabled = true in the environment root when Railway credentials are available.",
        "Provide RAILWAY_TOKEN (and workspace_id if needed) before running plan/apply for managed Railway resources.",
      ]
    }
    postgres = {
      status = var.enabled ? "managed_service" : "fallback_mode"
      reason = var.enabled ? "Railway Postgres is managed as a dedicated Railway service backed by a single attached volume." : "Railway Postgres resources are disabled until Railway credentials and any required provider configuration are supplied."
      procedure = [
        "Keep the managed Postgres service on a single service + single volume footprint to minimize Railway usage.",
        "Treat external operator DATABASE_URL values as optional local-only overrides for migration or restore-drill tooling.",
      ]
    }
    serverless = {
      status = "manual_verification_required"
      reason = "The Railway Serverless/sleep toggle is not modelled by the chosen Terraform provider."
      procedure = [
        "After apply, verify the backend service remains a persistent service with Serverless disabled in Railway.",
        "Repeat the verification after major service setting changes because the provider does not enforce this toggle.",
      ]
    }
  }
}

resource "railway_project" "backend" {
  count = var.enabled ? 1 : 0

  name = var.project_name

  default_environment = {
    name = var.environment_name
  }

  description    = var.project_description
  has_pr_deploys = false
  private        = true
  workspace_id   = var.workspace_id
}

resource "railway_service" "backend" {
  count = var.enabled ? 1 : 0

  name       = var.backend_service_name
  project_id = railway_project.backend[0].id
}

resource "railway_service" "postgres" {
  count = var.enabled ? 1 : 0

  name         = var.postgres_service_name
  project_id   = railway_project.backend[0].id
  source_image = var.postgres_source_image

  volume = {
    mount_path = var.postgres_volume_mount_path
    name       = var.postgres_volume_name
  }
}

resource "railway_variable_collection" "postgres" {
  count = var.enabled ? 1 : 0

  environment_id = railway_project.backend[0].default_environment.id
  service_id     = railway_service.postgres[0].id

  variables = [
    {
      name  = "POSTGRES_DB"
      value = var.postgres_database_name
    },
    {
      name  = "POSTGRES_USER"
      value = var.postgres_user
    },
    {
      name  = "POSTGRES_PASSWORD"
      value = var.postgres_password
    },
    {
      name  = "PGDATA"
      value = var.postgres_data_directory
    },
  ]
}

resource "railway_variable_collection" "backend" {
  count = var.enabled ? 1 : 0

  environment_id = railway_project.backend[0].default_environment.id
  service_id     = railway_service.backend[0].id

  variables = [
    for name in sort(keys(local.backend_environment)) : {
      name  = name
      value = local.backend_environment[name]
    }
  ]
}

resource "railway_custom_domain" "admin" {
  count = var.enabled ? 1 : 0

  domain         = var.admin_hostname
  environment_id = railway_project.backend[0].default_environment.id
  service_id     = railway_service.backend[0].id
}

output "backend_service_contract" {
  description = "Concrete Railway backend service composition plus explicit provider-gap fallbacks."
  value = {
    admin_hostname                    = var.admin_hostname
    api_hostname                      = var.api_hostname
    backend_service_domain            = null
    backend_service_domain_suffix     = null
    backend_service_name              = var.backend_service_name
    environment_id                    = try(railway_project.backend[0].default_environment.id, null)
    environment_name                  = var.environment_name
    fallback_markers                  = local.fallback_markers
    managed                           = var.enabled
    project_id                        = try(railway_project.backend[0].id, null)
    project_name                      = var.project_name
    postgres = {
      database_name          = var.postgres_database_name
      data_directory         = var.postgres_data_directory
      service_id             = try(railway_service.postgres[0].id, null)
      service_name           = var.postgres_service_name
      volume_mount_path      = var.postgres_volume_mount_path
      volume_name            = var.postgres_volume_name
      variable_collection_id = try(railway_variable_collection.postgres[0].id, null)
    }
    public_environment                = var.backend_public_environment
    required_public_environment_names = local.required_public_environment_variable_names
    required_secret_environment_names = local.required_secret_environment_variable_names
    optional_environment_names        = local.optional_environment_variable_names
    secret_values_supplied_externally = true
    service_domain_subdomain          = var.backend_service_domain_subdomain
    service_domains = {
      admin = {
        dns_record_value = try(railway_custom_domain.admin[0].dns_record_value, null)
        domain           = try(railway_custom_domain.admin[0].domain, var.admin_hostname)
        host_label       = try(railway_custom_domain.admin[0].host_label, null)
        id               = try(railway_custom_domain.admin[0].id, null)
        zone             = try(railway_custom_domain.admin[0].zone, null)
      }
      api = {
        dns_record_value = try(railway_custom_domain.admin[0].dns_record_value, null)
        domain           = try(railway_custom_domain.admin[0].domain, var.admin_hostname)
        host_label       = try(railway_custom_domain.admin[0].host_label, null)
        id               = try(railway_custom_domain.admin[0].id, null)
        zone             = try(railway_custom_domain.admin[0].zone, null)
      }
    }
    variable_collection_id = try(railway_variable_collection.backend[0].id, null)
  }
}

output "database_url" {
  description = "Production database connection URL for backend runtime."
  value       = local.managed_database_url
  sensitive   = true
}
