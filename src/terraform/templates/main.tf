module "resource_group" {
  source   = "../modules/azure/resource_group"
  name     = var.resource_group.name
  location = var.resource_group.location
  tags     = var.tags
}

module "vnet" {
  source              = "../modules/azure/vnet"
  vnet_name           = var.vnet.vnet_name
  address_space       = var.vnet.address_space
  resource_group_name = module.resource_group.name
  location            = var.location
  tags                = var.tags
}

module "subnet" {
  source              = "../modules/azure/subnet"
  subnet_name         = var.subnet.subnet_name
  vnet_name           = var.subnet.vnet_name
  address_prefixes    = var.subnet.address_prefixes
  resource_group_name = module.resource_group.name
}

module "vms" {
  source              = "../modules/azure/vm"
  for_each            = { for k, v in var.vms : k => v }
  resource_group_name = module.resource_group.name
  location            = var.location
  admin_username      = var.admin_username
  admin_password      = var.admin_password
  subnet_id           = module.subnet.subnet_id
  vm_name             = each.value.vm_name
  vm_size             = each.value.vm_size
  create_public_ip    = each.value.create_public_ip
  tags                = var.tags
}

module "cosmosdbs" {
  source              = "../modules/azure/cosmosdb"
  for_each            = { for k, v in var.cosmosdbs : k => v }
  resource_group_name = module.resource_group.name
  location            = var.location
  tags                = var.tags
}

module "storage_accounts" {
  source               = "../modules/azure/storage_account"
  for_each             = { for k, v in var.storage_accounts : k => v }
  resource_group_name  = module.resource_group.name
  location             = var.location
  storage_account_name = each.value.storage_account_name
  tags                 = var.tags
}

module "sql_servers" {
  source              = "../modules/azure/sql_server"
  for_each            = { for k, v in var.sql_servers : k => v }
  resource_group_name = module.resource_group.name
  location            = var.location
  sql_server_name     = each.value.sql_server_name
  admin_login         = each.value.admin_login
  admin_password      = each.value.admin_password
  tags                = var.tags
}

