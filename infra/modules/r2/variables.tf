variable "account_id" {
  description = "Cloudflare account identifier hosting the R2 bucket."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.account_id)) > 0
    error_message = "account_id must not be empty."
  }
}

variable "enabled" {
  description = "Whether to manage R2 resources in this module. When false, outputs emit explicit fallback markers only."
  type        = bool
  default     = true
}

variable "bucket_name" {
  description = "Logical R2 bucket name reserved for this environment."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.bucket_name)) > 0
    error_message = "bucket_name must not be empty."
  }
}

variable "public_hostname" {
  description = "Optional custom hostname intended for public media delivery."
  type        = string
  default     = null

  validation {
    condition     = var.public_hostname == null || (length(trimspace(var.public_hostname)) > 0 && !strcontains(var.public_hostname, "://"))
    error_message = "public_hostname must be null or a hostname without a URL scheme."
  }
}

variable "zone_id" {
  description = "Optional Cloudflare zone identifier used when creating an R2 custom domain."
  type        = string
  default     = null

  validation {
    condition     = var.zone_id == null || length(trimspace(var.zone_id)) > 0
    error_message = "zone_id must be null or a non-empty string."
  }
}

variable "zone_name" {
  description = "Optional Cloudflare zone name used when creating an R2 custom domain."
  type        = string
  default     = null

  validation {
    condition = (
      (var.zone_name == null || length(trimspace(var.zone_name)) > 0) &&
      (var.public_hostname == null || var.zone_id != null || var.zone_name != null)
    )
    error_message = "zone_name must be null or a non-empty string, and a zone identifier or name is required when public_hostname is set."
  }
}
