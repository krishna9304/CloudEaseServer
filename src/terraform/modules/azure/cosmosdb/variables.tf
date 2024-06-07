variable "cosmosdbs" {
  description = "Map of CosmosDB accounts to create"
  type = map(object({
    cosmosdb_name = string
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
