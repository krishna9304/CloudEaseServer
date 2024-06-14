terraform {
  required_version = ">= 1.7.5"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.105.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "<backendResourceGroup>"
    storage_account_name = "<backendStorageAccount>"
    container_name       = "<backendContainer>"
    key                  = "<backendKey>.tfstate"
  }
}



