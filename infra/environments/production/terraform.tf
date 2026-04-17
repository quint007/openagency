terraform {
  required_version = ">= 1.8.0"

  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.6"
    }
  }
  backend "s3" {
    bucket = "terraform-state"
    key    = "open-agency/terraform.tfstate" # path within the bucket

    endpoints = {
      s3 = "https://cc88628ad6e5a2e0a2c9cc9b9dd34ba3.r2.cloudflarestorage.com"
    }

    region = "auto" # required but ignored by R2

    # R2 doesn't support these — must disable
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }
}

provider "railway" {
  token = var.railway_token
}
