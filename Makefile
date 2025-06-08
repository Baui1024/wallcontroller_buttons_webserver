#
# This software is licensed under the Public Domain.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=webserver
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=Thomas Bauer <t.bauer_1024@gmx.de>
PKG_LICENSE:=CC BY-NC 4.0

include $(INCLUDE_DIR)/package.mk

define Package/webserver
	SECTION:=utils
	CATEGORY:=Utilities
	TITLE:=Wall Controller Web Interface
	DEPENDS:=+python3 +python3-websockets +python3-uci +python3-bottle +python3-netifaces
endef

define Package/webserver/description
	Web interface for managing wall controller network settings
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Compile
	# No compilation needed for Python files
endef

define Package/webserver/install
	# Create directory structure
	$(INSTALL_DIR) $(1)/usr/bin/webserver
	$(INSTALL_DIR) $(1)/usr/bin/webserver/frontend
	$(INSTALL_DIR) $(1)/etc/init.d
	
	# Install main Python files
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/../main.py $(1)/usr/bin/webserver/
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/../ip_tool.py $(1)/usr/bin/webserver/
	
	# Install init.d script
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/../webserver $(1)/etc/init.d/
	
	# Copy frontend files (recursively)
	$(CP) -r $(PKG_BUILD_DIR)/../frontend/dist/* $(1)/usr/bin/webserver/frontend/dist/
endef

$(eval $(call BuildPackage,webserver))