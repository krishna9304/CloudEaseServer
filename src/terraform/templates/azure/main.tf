provider "azurerm" {
  skip_provider_registration = true
  features {}
}

module "resource_group" {
  source   = "../../src/terraform/modules/azure/resource_group"
  name     = var.resource_group
  location = var.location
}

module "vnet" {
  source              = "../../src/terraform/modules/azure/vnet"
  name                = var.vnet.vnet_name
  resource_group_name = module.resource_group.name
  location            = var.location
  address_space       = var.vnet.address_space
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
  for_each            = var.vms
  name                = each.value.vm_name
  resource_group_name = module.resource_group.name
  location            = var.location
}

module "storage" {
  source               = "../../src/terraform/modules/azure/storage"
  for_each             = var.storage_accounts
  storage_account_name = each.value.storage_account_name
  resource_group_name  = module.resource_group.name
  location             = var.location
  container_name       = "default"
}

module "cosmosdb" {
  source              = "../../src/terraform/modules/azure/mongodb"
  for_each            = var.cosmosdbs
  account_name        = each.value.cosmosdb_name
  resource_group_name = module.resource_group.name
  location            = var.location
  database_name       = "default"
}

module "vm" {
  source              = "../../src/terraform/modules/azure/linux_vm"
  for_each            = var.vms
  vm_name             = each.value.vm_name
  resource_group_name = module.resource_group.name
  location            = var.location
  vm_size             = each.value.vm_size
  admin_username      = var.admin_username
  ssh_public_key      = file("./tfkey.pub")
  subnet_id           = module.subnet.id
  public_ip_id        = each.value.create_public_ip ? module.public_ip[each.key].id : null
}
