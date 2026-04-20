variable "zone_id" {
  description = "Cloudflare zone identifier when the caller prefers ID-based targeting."
  type        = string
  default     = null

  validation {
    condition     = var.zone_id == null || length(trimspace(var.zone_id)) > 0
    error_message = "zone_id must be null or a non-empty string."
  }
}

variable "enabled" {
  description = "Whether to manage Cloudflare DNS records in this module. When false, outputs emit explicit fallback markers only."
  type        = bool
  default     = true
}

variable "zone_name" {
  description = "Cloudflare zone name when the caller prefers name-based targeting."
  type        = string
  default     = null

  validation {
    condition = (
      (var.zone_name == null || length(trimspace(var.zone_name)) > 0) &&
      (var.zone_id != null || var.zone_name != null)
    )
    error_message = "zone_name must be null or a non-empty string, and either zone_id or zone_name must be provided."
  }
}

variable "managed_hostnames" {
  description = "Environment hostnames that should eventually be backed by Cloudflare DNS records."
  type = object({
    admin = string
    api   = string
    marketing = string
  })
  nullable = false

  validation {
    condition = alltrue([
      for value in values(var.managed_hostnames) : length(trimspace(value)) > 0 && !strcontains(value, "://")
    ])
    error_message = "managed_hostnames values must be non-empty hostnames without URL schemes."
  }
}

variable "dns_targets" {
  description = "Optional DNS targets, typically supplied later from Railway custom-domain resources."
  type = object({
    admin = optional(string)
    api   = optional(string)
    marketing = optional(string)
  })
  default = {}
}
