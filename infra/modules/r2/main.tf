terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

locals {
  normalized_zone_name = var.zone_name == null ? null : trimspace(var.zone_name)
  fallback_markers = {
    provider_auth = {
      status = var.enabled ? "configured" : "fallback_mode"
      reason = var.enabled ? "R2 resource management is enabled for this environment." : "R2 resources are disabled until Cloudflare credentials and account details are supplied."
      procedure = var.enabled ? [] : [
        "Set r2_enabled = true in the environment root when Cloudflare credentials are available.",
        "Provide CLOUDFLARE_API_TOKEN plus the environment-specific cloudflare_account_id before planning managed R2 resources.",
      ]
    }
    cors_and_lifecycle = {
      status = "manual_follow_up_required"
      reason = "The Cloudflare provider manages bucket creation, but advanced CORS and lifecycle settings require the AWS provider against the R2 S3-compatible endpoint."
      procedure = [
        "If Payload media uploads need bucket-level CORS or lifecycle rules, add AWS-provider-compatible R2 resources in a follow-up change.",
        "Use the bucket endpoint and region outputs from this module with skip validation flags recommended for R2.",
      ]
    }
  }
}

data "cloudflare_zones" "selected" {
  count = var.enabled && var.public_hostname != null && var.zone_id == null ? 1 : 0

  match     = "all"
  max_items = 1
  name      = local.normalized_zone_name
  status    = "active"
}

locals {
  resolved_zone_id = !var.enabled || var.public_hostname == null ? var.zone_id : (var.zone_id != null ? var.zone_id : data.cloudflare_zones.selected[0].result[0].id)
}

resource "cloudflare_r2_bucket" "media" {
  count = var.enabled ? 1 : 0

  account_id = var.account_id
  location   = "WEUR"
  name       = var.bucket_name
}

resource "cloudflare_r2_custom_domain" "public" {
  count = var.enabled && var.public_hostname != null ? 1 : 0

  account_id  = var.account_id
  bucket_name = cloudflare_r2_bucket.media[0].name
  domain      = var.public_hostname
  enabled     = true
  zone_id     = local.resolved_zone_id
}

output "bucket_contract" {
  description = "Concrete R2 bucket composition plus explicit follow-up markers for unsupported advanced settings."
  value = {
    account_id                        = var.account_id
    aws_region                        = "auto"
    bucket_name                       = var.bucket_name
    bucket_id                         = try(cloudflare_r2_bucket.media[0].id, null)
    fallback_markers                  = local.fallback_markers
    managed                           = var.enabled
    public_hostname                   = var.public_hostname
    public_custom_domain              = try(cloudflare_r2_custom_domain.public[0].domain, var.public_hostname)
    s3_compatible_endpoint            = "https://${var.account_id}.r2.cloudflarestorage.com"
    secret_values_supplied_externally = true
    required_secret_variable_names = [
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
    ]
  }
}
