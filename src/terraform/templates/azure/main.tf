provider "azurerm" {
  skip_provider_registration = true
  features {}
}

module "resource_group" {
  source   = "../../src/terraform/modules/azure/resource_group"
  name     = var.resource_group
  location = var.location
  tags     = var.tags
}

module "vnet" {
  source              = "../../src/terraform/modules/azure/vnet"
  name                = var.vnet.vnet_name
  resource_group_name = module.resource_group.name
  location            = var.location
  address_space       = var.vnet.address_space
  tags                = var.tags
}

module "subnet" {
  source              = "../../src/terraform/modules/azure/subnet"
  name                = var.subnet.subnet_name
  resource_group_name = module.resource_group.name
  vnet_name           = module.vnet.name
  address_prefixes    = var.subnet.address_prefixes
}

module "public_ip" {
  source              = "../../src/terraform/modules/azure/public_ip"
  for_each            = var.linux_vms
  name                = each.value.vm_name
  resource_group_name = module.resource_group.name
  location            = var.location
  tags                = var.tags
}

module "storage" {
  source               = "../../src/terraform/modules/azure/storage"
  for_each             = var.storage_accounts
  storage_account_name = each.value.storage_account_name
  resource_group_name  = module.resource_group.name
  location             = var.location
  container_name       = "default"
  tags                 = var.tags
}

module "mongodb" {
  source              = "../../src/terraform/modules/azure/mongodb"
  for_each            = var.mongodbs
  account_name        = each.value.mongodb_name
  resource_group_name = module.resource_group.name
  location            = var.location
  database_name       = each.value.database_name
  tags                = var.tags
}

module "linux_vm" {
  source              = "../../src/terraform/modules/azure/linux_vm"
  for_each            = var.linux_vms
  vm_name             = each.value.vm_name
  resource_group_name = module.resource_group.name
  location            = var.location
  vm_size             = each.value.vm_size
  admin_username      = var.admin_username
  ssh_public_key      = file("./tfkey.pub")
  subnet_id           = module.subnet.id
  public_ip_id        = each.value.create_public_ip ? module.public_ip[each.key].id : null
  tags                = var.tags
}
