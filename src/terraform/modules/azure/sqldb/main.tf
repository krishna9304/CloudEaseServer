resource "azurerm_sql_server" "sql_server" {
  for_each = var.sql_servers

  name                         = each.value.sql_server_name
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = each.value.admin_login
  administrator_login_password = each.value.admin_password

  tags = var.tags
}

resource "azurerm_sql_database" "sql_database" {
  for_each = var.sql_servers

  name                             = "${each.value.sql_server_name}-db"
  resource_group_name              = var.resource_group_name
  location                         = var.location
  server_name                      = azurerm_sql_server.sql_server[each.key].name
  edition                          = "Standard"
  requested_service_objective_name = "S1"
}
