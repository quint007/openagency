terraform {
  required_providers {
    vercel = {
      source = "vercel/vercel"
    }
  }
}

locals {
  production_environment = {
    for key, value in var.production_environment : key => trimspace(coalesce(value, ""))
    if length(trimspace(coalesce(value, ""))) > 0
  }

  production_secret_environment = {
    for key, value in var.production_secret_environment : key => trimspace(coalesce(value, ""))
    if length(trimspace(coalesce(value, ""))) > 0
  }

  required_environment_variable_names = sort(distinct(concat(
    keys(local.production_environment),
    keys(local.production_secret_environment),
  )))

  fallback_markers = {
    provider_auth = {
      status = var.enabled ? "configured" : "fallback_mode"
      reason = var.enabled ? "Vercel project management is enabled for this environment." : "Vercel resources are disabled until Vercel credentials and project settings are supplied."
      procedure = var.enabled ? [] : [
        "Set vercel_enabled = true in the production environment when Vercel credentials are available.",
        "Provide VERCEL_API_TOKEN and optionally VERCEL_TEAM before running plan/apply for managed Vercel resources.",
      ]
    }
    dns = {
      status = var.domain == null ? "not_configured" : "manual_verification_required"
      reason = var.domain == null ? "No production marketing domain is attached in this module." : "The marketing domain is attached in Vercel, but external DNS still needs to point at Vercel for certificate issuance and traffic cutover."
      procedure = var.domain == null ? [] : [
        "Point the external DNS record for the marketing hostname to Vercel's required target before expecting certificate issuance.",
        "Verify the attached domain inside the Vercel dashboard after apply because DNS ownership and propagation are external dependencies.",
      ]
    }
  }
}

resource "vercel_project" "marketing" {
  count = var.enabled ? 1 : 0

  name                                              = var.project_name
  framework                                         = var.framework
  auto_assign_custom_domains                        = true
  automatically_expose_system_environment_variables = true
  build_command                                     = var.build_command
  ignore_command                                    = "if [ \"$VERCEL_GIT_COMMIT_REF\" = \"${var.production_branch}\" ]; then exit 1; else exit 0; fi"
  install_command                                   = var.install_command
  root_directory                                    = var.root_directory
  team_id                                           = var.team_id
}

resource "vercel_project_environment_variable" "marketing" {
  for_each = var.enabled ? local.production_environment : {}

  project_id = vercel_project.marketing[0].id
  key        = each.key
  value      = each.value
  target     = ["production"]
  sensitive  = false
  comment    = "Managed by OpenTofu for the marketing Vercel project."
  team_id    = var.team_id
}

resource "vercel_project_environment_variable" "marketing_secret" {
  for_each = var.enabled ? nonsensitive(toset(keys(local.production_secret_environment))) : []

  project_id = vercel_project.marketing[0].id
  key        = each.value
  value      = local.production_secret_environment[each.value]
  target     = ["production"]
  sensitive  = true
  comment    = "Managed by OpenTofu for the marketing Vercel project."
  team_id    = var.team_id
}

resource "vercel_project_domain" "marketing" {
  count = var.enabled && var.domain != null ? 1 : 0

  project_id = vercel_project.marketing[0].id
  domain     = var.domain
  team_id    = var.team_id
}

output "project_contract" {
  description = "Concrete Vercel marketing project composition plus explicit fallback markers."
  value = {
    managed      = var.enabled
    team_id      = var.team_id
    project_id   = try(vercel_project.marketing[0].id, null)
    project_name = var.project_name
    framework    = var.framework
    git_repository = {
      production_branch = var.production_branch
      provider          = "github"
      repo              = var.git_repository
    }
    build = {
      build_command   = var.build_command
      install_command = var.install_command
      root_directory  = var.root_directory
    }
    domain = {
      configured = var.domain != null
      hostname   = var.domain
      id         = try(vercel_project_domain.marketing[0].id, null)
    }
    environment_variables = {
      production_public_names = sort(keys(local.production_environment))
      production_secret_names = sort(keys(local.production_secret_environment))
      required_names          = local.required_environment_variable_names
      managed_count           = length(local.production_environment) + length(local.production_secret_environment)
    }
    fallback_markers = local.fallback_markers
  }
}
