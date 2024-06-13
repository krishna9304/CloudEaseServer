variable "tags" {
  description = "Tags for the resources"
  type        = map(string)
  default     = {}
}

variable "resource_group" {
  description = "Resource Group configuration"
  type = object({
    name = string
  })
}

variable "vnet" {
  description = "VNet configuration"
  type = object({
    vnet_name     = string
    address_space = list(string)
  })
}

variable "subnet" {
  description = "Subnet configuration"
  type = object({
    subnet_name      = string
    vnet_name        = string
    address_prefixes = list(string)
  })
}

variable "vms" {
  description = "Map of VMs to create"
  type = map(object({
    vm_name          = string
    vm_size          = string
    create_public_ip = bool
  }))
  default = {}
}

variable "cosmosdbs" {
  description = "Map of CosmosDB accounts to create"
  type = map(object({
    cosmosdb_name = string
  }))
  default = {}
}

variable "storage_accounts" {
  description = "Map of Storage Accounts to create"
  type = map(object({
    storage_account_name = string
  }))
  default = {}
}

variable "sql_servers" {
  description = "Map of SQL Servers to create"
  type = map(object({
    sql_server_name = string
    admin_login     = string
    admin_password  = string
  }))
  default = {}
}

variable "admin_username" {
  description = "Admin username for the VMs"
  type        = string
}

variable "admin_password" {
  description = "Admin password for the VMs"
  type        = string
}

variable "location" {
  description = "Location of the resources"
  type        = string
}
