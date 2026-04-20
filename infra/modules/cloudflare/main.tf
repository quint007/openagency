terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

locals {
  normalized_zone_name = var.zone_name == null ? null : trimspace(var.zone_name)
}

data "cloudflare_zones" "selected" {
  count = var.enabled && var.zone_id == null ? 1 : 0

  match     = "all"
  max_items = 1
  name      = local.normalized_zone_name
  status    = "active"
}

locals {
  resolved_zone_id = !var.enabled ? var.zone_id : (var.zone_id != null ? var.zone_id : data.cloudflare_zones.selected[0].result[0].id)
}

resource "cloudflare_dns_record" "admin" {
  count = var.enabled ? 1 : 0

  zone_id = local.resolved_zone_id
  name    = var.managed_hostnames.admin
  type    = "CNAME"
  content = try(var.dns_targets.admin, null)
  proxied = false
  ttl     = 1

  comment = "Managed by OpenTofu for the Railway-backed admin hostname. Keep DNS-only so Railway terminates TLS directly."
}

output "dns_contract" {
  description = "Concrete Cloudflare DNS composition for the environment hostnames."
  value = {
    api = {
      id            = try(cloudflare_dns_record.admin[0].id, null)
      hostname      = var.managed_hostnames.api
      managed       = false
      proxied       = try(cloudflare_dns_record.admin[0].proxied, null)
      record_type   = try(cloudflare_dns_record.admin[0].type, "CNAME")
      target        = try(var.dns_targets.admin, null)
      target_source = "admin hostname /api route"
    }
    admin = {
      id            = try(cloudflare_dns_record.admin[0].id, null)
      hostname      = var.managed_hostnames.admin
      managed       = var.enabled
      proxied       = try(cloudflare_dns_record.admin[0].proxied, null)
      record_type   = try(cloudflare_dns_record.admin[0].type, "CNAME")
      target        = try(var.dns_targets.admin, null)
      target_source = try(var.dns_targets.admin, null) == null ? "railway_custom_domain.admin.dns_record_value" : "explicit"
    }
    zone_id   = local.resolved_zone_id
    zone_name = local.normalized_zone_name
    fallback_markers = var.enabled ? {} : {
      provider_auth = {
        status = "fallback_mode"
        reason = "Cloudflare DNS records are disabled until Cloudflare credentials and zone targeting are supplied."
        procedure = [
          "Set cloudflare_dns_enabled = true in the environment root when Cloudflare credentials are available.",
          "Provide CLOUDFLARE_API_TOKEN and either cloudflare_zone_id or a resolvable cloudflare_zone_name before planning managed DNS resources.",
        ]
      }
    }
  }
}
