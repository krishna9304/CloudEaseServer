resource "azurerm_storage_account" "storage" {
  for_each                 = var.storage_accounts
  name                     = each.value.storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = var.tags
}
