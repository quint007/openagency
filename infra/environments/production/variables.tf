variable "railway_project_name" {
  description = "Railway project name used by the production environment root."
  type        = string
  nullable    = false
  default     = "open-agency-production"
}

variable "railway_enabled" {
  description = "Whether production should manage Railway resources directly. Defaults to fallback mode until provider credentials are available."
  type        = bool
  default     = false
}

variable "railway_token" {
  description = "Railway API token placeholder for production plan-time provider configuration. Replace externally when railway_enabled is true."
  type        = string
  sensitive   = true
  default     = "replace-with-production-railway-token"
}

variable "vercel_enabled" {
  description = "Whether production should manage the marketing Vercel project directly. Defaults to fallback mode until provider credentials are available."
  type        = bool
  default     = false
}

variable "vercel_api_token" {
  description = "Vercel API token placeholder for production plan-time provider configuration. Replace externally when vercel_enabled is true."
  type        = string
  sensitive   = true
  default     = "replace-with-production-vercel-token"
}

variable "vercel_team" {
  description = "Optional Vercel team slug or ID used by the production environment root."
  type        = string
  default     = null
}

variable "marketing_vercel_project_name" {
  description = "Vercel project name used for the production marketing site."
  type        = string
  nullable    = false
  default     = "open-agency-marketing"
}

variable "marketing_vercel_domain" {
  description = "Production domain attached to the marketing Vercel project."
  type        = string
  default     = "open-agency.io"
}

variable "cloudflare_dns_enabled" {
  description = "Whether production should manage Cloudflare DNS records directly. Defaults to fallback mode until provider credentials are available."
  type        = bool
  default     = false
}

variable "r2_enabled" {
  description = "Whether production should manage R2 resources directly. Defaults to fallback mode until provider credentials are available."
  type        = bool
  default     = false
}

variable "cloudflare_zone_id" {
  description = "Optional Cloudflare zone ID for production DNS management."
  type        = string
  default     = null
}

variable "cloudflare_zone_name" {
  description = "Optional Cloudflare zone name for production DNS management."
  type        = string
  default     = "open-agency.io"
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID for production R2 bucket management."
  type        = string
  nullable    = false
  default     = "replace-with-production-cloudflare-account-id"
}

variable "marketing_app_base_url" {
  description = "Externally managed production marketing app base URL used for backend revalidation delivery."
  type        = string
  nullable    = false
  default     = "https://open-agency.io"
}

variable "courses_app_base_url" {
  description = "Externally managed production courses app base URL used for backend revalidation delivery."
  type        = string
  nullable    = false
  default     = "https://courses.open-agency.io"
}

variable "r2_public_hostname" {
  description = "Optional public hostname reserved for production media delivery."
  type        = string
  default     = "media.open-agency.io"
}

variable "backend_secret_environment" {
  description = "Sensitive backend runtime environment values supplied externally for production."
  type = object({
    PAYLOAD_SECRET    = string
    CRON_SECRET       = string
    PREVIEW_SECRET    = string
    REVALIDATE_SECRET = string
  })
  nullable  = false
  sensitive = true
  default = {
    PAYLOAD_SECRET    = "replace-with-production-payload-secret"
    CRON_SECRET       = "replace-with-production-cron-secret"
    PREVIEW_SECRET    = "replace-with-production-preview-secret"
    REVALIDATE_SECRET = "replace-with-production-revalidate-secret"
  }
}

variable "postgres_database_name" {
  description = "Database name for the managed Railway Postgres production service."
  type        = string
  nullable    = false
  default     = "open_agency"
}

variable "postgres_user" {
  description = "Database user for the managed Railway Postgres production service."
  type        = string
  nullable    = false
  default     = "open_agency"
}

variable "postgres_password" {
  description = "Sensitive password for the managed Railway Postgres production service."
  type        = string
  sensitive   = true
  nullable    = false
  default     = "replace-with-production-postgres-password"
}

variable "backend_optional_environment" {
  description = "Optional backend runtime environment values for production."
  type = object({
    ALPHA_BASIC_AUTH_PASSWORD = optional(string)
    ALPHA_BASIC_AUTH_USERNAME = optional(string)
    R2_ACCESS_KEY_ID          = optional(string)
    R2_BUCKET                 = optional(string)
    R2_ENDPOINT               = optional(string)
    R2_PUBLIC_BASE_URL        = optional(string)
    R2_REGION                 = optional(string)
    R2_SECRET_ACCESS_KEY      = optional(string)
    RESEND_API_KEY            = optional(string)
    REVALIDATE_TIMEOUT_MS     = optional(string)
  })
  default = {}
}
