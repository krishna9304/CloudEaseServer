module "resource_group" {
  source   = "../../modules/azure/rg"
  name     = var.resource_group.name
  location = var.location
  tags     = var.tags
}

module "vnet" {
  source              = "../../modules/azure/vnet"
  vnet_name           = var.vnet.vnet_name
  address_space       = var.vnet.address_space
  resource_group_name = module.resource_group.name
  location            = var.location
  tags                = var.tags
}

module "subnet" {
  source              = "../../modules/azure/subnet"
  subnet_name         = var.subnet.subnet_name
  vnet_name           = var.subnet.vnet_name
  address_prefixes    = var.subnet.address_prefixes
  resource_group_name = module.resource_group.name
}

module "vms" {
  source              = "../../modules/azure/compute"
  vms                 = var.vms
  resource_group_name = module.resource_group.name
  location            = var.location
  admin_username      = var.admin_username
  admin_password      = var.admin_password
  subnet_id           = module.subnet.subnet_id
  tags                = var.tags
}

module "cosmosdbs" {
  source              = "../../modules/azure/cosmosdb"
  cosmosdbs           = var.cosmosdbs
  resource_group_name = module.resource_group.name
  location            = var.location
  tags                = var.tags
}

module "storage_accounts" {
  source              = "../../modules/azure/storage"
  storage_accounts    = var.storage_accounts
  resource_group_name = module.resource_group.name
  location            = var.location
  tags                = var.tags
}

module "sql_servers" {
  source              = "../../modules/azure/sqldb"
  sql_servers         = var.sql_servers
  resource_group_name = module.resource_group.name
  location            = var.location
  tags                = var.tags
}

