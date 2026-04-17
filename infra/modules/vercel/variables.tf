variable "enabled" {
  description = "Whether to manage Vercel resources in this module. When false, outputs emit explicit fallback markers only."
  type        = bool
  default     = true
}

variable "team_id" {
  description = "Optional Vercel team slug or ID. When omitted, the provider default team is used."
  type        = string
  default     = null

  validation {
    condition     = var.team_id == null || length(trimspace(var.team_id)) > 0
    error_message = "team_id must be null or a non-empty string."
  }
}

variable "project_name" {
  description = "Vercel project name for the marketing app."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.project_name)) > 0
    error_message = "project_name must not be empty."
  }
}

variable "framework" {
  description = "Framework slug to configure on the Vercel project."
  type        = string
  nullable    = false
  default     = "nextjs"
}

variable "git_repository" {
  description = "GitHub repository connected to the Vercel project."
  type        = string
  nullable    = false

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", trimspace(var.git_repository)))
    error_message = "git_repository must be in owner/repo format."
  }
}

variable "production_branch" {
  description = "Git branch that should trigger production deployments."
  type        = string
  nullable    = false
  default     = "main"
}

variable "build_command" {
  description = "Explicit build command for the Vercel project."
  type        = string
  nullable    = false
}

variable "install_command" {
  description = "Explicit install command for the Vercel project."
  type        = string
  nullable    = false
}

variable "root_directory" {
  description = "Relative root directory for the Vercel project."
  type        = string
  nullable    = false
}

variable "domain" {
  description = "Production domain attached to the Vercel project. Null skips domain attachment."
  type        = string
  default     = null

  validation {
    condition     = var.domain == null || (length(trimspace(var.domain)) > 0 && !strcontains(var.domain, "://"))
    error_message = "domain must be null or a hostname without a URL scheme."
  }
}

variable "production_environment" {
  description = "Non-sensitive production environment variables for the marketing project."
  type        = map(string)
  default     = {}
}

variable "preview_environment" {
  description = "Non-sensitive preview environment variables for the marketing project."
  type        = map(string)
  default     = {}
}

variable "production_secret_environment" {
  description = "Sensitive production environment variables for the marketing project."
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "preview_secret_environment" {
  description = "Sensitive preview environment variables for the marketing project."
  type        = map(string)
  default     = {}
  sensitive   = true
}
