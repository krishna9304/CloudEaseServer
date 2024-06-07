variable "name" {
  description = "Name of the Resource Group"
  type        = string
}

variable "location" {
  description = "Location of the Resource Group"
  type        = string
}

variable "tags" {
  description = "Tags for the resources"
  type        = map(string)
  default     = {}
}
