resource "azurerm_network_interface" "vm_nic" {
  for_each            = var.vms
  name                = "${each.value.vm_name}-nic"
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = var.subnet_id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = each.value.create_public_ip ? azurerm_public_ip.vm_pip[each.key].id : null
  }
}

resource "azurerm_public_ip" "vm_pip" {
  for_each            = { for k, v in var.vms : k => v if v.create_public_ip }
  name                = "${each.value.vm_name}-pip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Dynamic"
}

resource "azurerm_virtual_machine" "vm" {
  for_each              = var.vms
  name                  = each.value.vm_name
  location              = var.location
  resource_group_name   = var.resource_group_name
  network_interface_ids = [azurerm_network_interface.vm_nic[each.key].id]
  vm_size               = each.value.vm_size

  storage_os_disk {
    name              = "${each.value.vm_name}-osdisk"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "Standard_LRS"
  }

  storage_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  os_profile {
    computer_name  = each.value.vm_name
    admin_username = var.admin_username
    admin_password = var.admin_password
  }

  os_profile_linux_config {
    disable_password_authentication = false
  }

  tags = var.tags
}
