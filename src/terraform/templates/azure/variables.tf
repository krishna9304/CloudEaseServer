variable "tags" {
  type = map(string)
}

variable "vnet" {
  type = object({
    vnet_name     = string
    address_space = list(string)
  })
}

variable "subnet" {
  type = object({
    subnet_name      = string
    vnet_name        = string
    address_prefixes = list(string)
  })
}

variable "linux_vms" {
  type = map(object({
    vm_name          = string
    vm_size          = string
    create_public_ip = bool
  }))
}

variable "mongodbs" {
  type = map(object({
    mongodb_name  = string
    database_name = string
  }))
}

variable "storage_accounts" {
  type = map(object({
    storage_account_name = string
  }))
}

variable "admin_username" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group" {
  type = string
}