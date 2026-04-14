variable "project_name" {
  description = "Railway project name for the target environment."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.project_name)) > 0
    error_message = "project_name must not be empty."
  }
}

variable "enabled" {
  description = "Whether to manage Railway resources in this module. When false, outputs emit explicit fallback markers only."
  type        = bool
  default     = true
}

variable "environment_name" {
  description = "Railway environment name for the target root module."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.environment_name)) > 0
    error_message = "environment_name must not be empty."
  }
}

variable "backend_service_name" {
  description = "Logical Railway service name for the Payload backend."
  type        = string
  nullable    = false
  default     = "backend"

  validation {
    condition     = length(trimspace(var.backend_service_name)) > 0
    error_message = "backend_service_name must not be empty."
  }
}

variable "api_hostname" {
  description = "Hostname reserved for the API alias in this environment."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.api_hostname)) > 0 && !strcontains(var.api_hostname, "://")
    error_message = "api_hostname must be a hostname without a URL scheme."
  }
}

variable "backend_service_domain_subdomain" {
  description = "Environment-specific Railway subdomain reserved for the backend service."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.backend_service_domain_subdomain)) > 0 && !strcontains(var.backend_service_domain_subdomain, ".")
    error_message = "backend_service_domain_subdomain must be a non-empty Railway subdomain label."
  }
}

variable "project_description" {
  description = "Optional description for the Railway project."
  type        = string
  default     = null
}

variable "workspace_id" {
  description = "Optional Railway workspace ID when the token can access multiple workspaces."
  type        = string
  default     = null

  validation {
    condition     = var.workspace_id == null || length(trimspace(var.workspace_id)) > 0
    error_message = "workspace_id must be null or a non-empty string."
  }
}

variable "admin_hostname" {
  description = "Hostname reserved for the admin surface in this environment."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.admin_hostname)) > 0 && !strcontains(var.admin_hostname, "://")
    error_message = "admin_hostname must be a hostname without a URL scheme."
  }
}

variable "backend_public_environment" {
  description = "Non-secret backend runtime environment values."
  type = object({
    NEXT_PUBLIC_SERVER_URL = string
    MARKETING_APP_BASE_URL = string
    COURSES_APP_BASE_URL   = string
  })
  nullable = false

  validation {
    condition = alltrue([
      for value in values(var.backend_public_environment) : length(trimspace(value)) > 0
    ])
    error_message = "All backend_public_environment values must be non-empty strings."
  }
}

variable "backend_secret_environment" {
  description = "Sensitive backend runtime environment values. Supply these externally at plan/apply time."
  type = object({
    PAYLOAD_SECRET    = string
    CRON_SECRET       = string
    PREVIEW_SECRET    = string
    REVALIDATE_SECRET = string
  })
  nullable  = false
  sensitive = true

  validation {
    condition = alltrue([
      for value in values(var.backend_secret_environment) : length(trimspace(value)) > 0
    ])
    error_message = "All backend_secret_environment values must be non-empty strings."
  }
}

variable "postgres_service_name" {
  description = "Logical Railway service name for the managed Postgres instance."
  type        = string
  nullable    = false
  default     = "postgres"

  validation {
    condition     = length(trimspace(var.postgres_service_name)) > 0
    error_message = "postgres_service_name must not be empty."
  }
}

variable "postgres_database_name" {
  description = "Database name to initialize inside the managed Railway Postgres service."
  type        = string
  nullable    = false
  default     = "open_agency"

  validation {
    condition     = can(regex("^[A-Za-z0-9_]+$", trimspace(var.postgres_database_name)))
    error_message = "postgres_database_name must contain only letters, numbers, and underscores."
  }
}

variable "postgres_user" {
  description = "Database user for the managed Railway Postgres service."
  type        = string
  nullable    = false
  default     = "open_agency"

  validation {
    condition     = can(regex("^[A-Za-z0-9_]+$", trimspace(var.postgres_user)))
    error_message = "postgres_user must contain only letters, numbers, and underscores."
  }
}

variable "postgres_password" {
  description = "Sensitive password for the managed Railway Postgres service. Supply externally at plan/apply time."
  type        = string
  nullable    = false
  sensitive   = true

  validation {
    condition     = length(trimspace(var.postgres_password)) >= 16
    error_message = "postgres_password must be at least 16 characters long."
  }
}

variable "postgres_source_image" {
  description = "Railway source image used for the managed Postgres service."
  type        = string
  nullable    = false
  default     = "ghcr.io/railwayapp-templates/postgres-ssl:16"
}

variable "postgres_volume_name" {
  description = "Volume name attached to the managed Railway Postgres service."
  type        = string
  nullable    = false
  default     = "postgres-data"
}

variable "postgres_volume_mount_path" {
  description = "Mount path used by the managed Railway Postgres service volume."
  type        = string
  nullable    = false
  default     = "/var/lib/postgresql/data"
}

variable "postgres_data_directory" {
  description = "Postgres data directory inside the mounted volume. Must be a subdirectory rather than the mount root."
  type        = string
  nullable    = false
  default     = "/var/lib/postgresql/data/pgdata"
}

variable "backend_optional_environment" {
  description = "Optional backend runtime environment values."
  type = object({
    REVALIDATE_TIMEOUT_MS = optional(string)
  })
  default = {}

  validation {
    condition = (
      try(var.backend_optional_environment.REVALIDATE_TIMEOUT_MS, null) == null ||
      can(regex("^[1-9][0-9]*$", trimspace(var.backend_optional_environment.REVALIDATE_TIMEOUT_MS)))
    )
    error_message = "backend_optional_environment.REVALIDATE_TIMEOUT_MS must be a positive integer string when set."
  }
}
