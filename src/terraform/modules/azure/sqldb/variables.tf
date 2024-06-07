variable "sql_servers" {
  description = "Map of SQL Servers to create"
  type = map(object({
    sql_server_name = string
    admin_login     = string
    admin_password  = string
  }))
  default = {}
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "tags" {
  description = "Tags for the resources"
  type        = map(string)
  default     = {}
}
