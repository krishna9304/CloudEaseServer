output "cosmosdb_ids" {
  value = azurerm_cosmosdb_account.cosmosdb.*.id
}
