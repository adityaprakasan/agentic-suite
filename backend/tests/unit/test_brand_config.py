"""
Unit tests for email brand configuration
"""

import pytest
from dataclasses import fields
from backend.core.config.brand import EmailBrandConfig, validate_hex_color, get_brand_replaced_text


class TestEmailBrandConfig:
    """Test EmailBrandConfig model and validation"""

    def test_default_brand_config(self):
        """Test default EmailBrandConfig values"""
        config = EmailBrandConfig()

        assert config.brand_name == "Adentic"
        assert config.primary_color == "#CC3A00"
        assert config.logo_url == "https://adentic.com/logo.png"
        assert config.copyright_text == "© 2025 Adentic. All rights reserved."
        assert config.support_email == "support@adentic.com"
        assert config.company_address == "San Francisco, CA"

    def test_brand_name_not_kortix(self):
        """Ensure brand name is Adentic, not Kortix"""
        config = EmailBrandConfig()

        assert "Kortix" not in config.brand_name
        assert "Adentic" in config.brand_name

    def test_copyright_text_updated(self):
        """Ensure copyright text references Adentic"""
        config = EmailBrandConfig()

        assert "Kortix" not in config.copyright_text
        assert "Adentic" in config.copyright_text
        assert "2025" in config.copyright_text

    def test_email_domain_consistency(self):
        """Ensure email addresses use adentic.com domain"""
        config = EmailBrandConfig()

        assert "@adentic.com" in config.support_email
        assert "@kortix" not in config.support_email

    def test_logo_url_consistency(self):
        """Ensure logo URL points to adentic.com"""
        config = EmailBrandConfig()

        assert "adentic.com" in config.logo_url
        assert "kortix" not in config.logo_url.lower()


class TestColorValidation:
    """Test color validation functions"""

    def test_validate_hex_color_valid(self):
        """Test validation of valid hex colors"""
        assert validate_hex_color("#CC3A00") is True
        assert validate_hex_color("#000000") is True
        assert validate_hex_color("#FFFFFF") is True
        assert validate_hex_color("#abc123") is True
        assert validate_hex_color("#ABC123") is True

    def test_validate_hex_color_invalid(self):
        """Test rejection of invalid hex colors"""
        assert validate_hex_color("CC3A00") is False  # Missing #
        assert validate_hex_color("#CC3A0") is False  # Too short
        assert validate_hex_color("#CC3A000") is False  # Too long
        assert validate_hex_color("#GGGGGG") is False  # Invalid characters
        assert validate_hex_color("rgb(204, 58, 0)") is False  # Wrong format
        assert validate_hex_color("") is False  # Empty string
        assert validate_hex_color("#") is False  # Just hash

    def test_primary_color_is_valid(self):
        """Test that the default primary color is valid"""
        config = EmailBrandConfig()
        assert validate_hex_color(config.primary_color) is True


class TestBrandReplacement:
    """Test brand text replacement function"""

    def test_replace_kortix_with_adentic(self):
        """Test that Kortix references are replaced with Adentic"""
        test_cases = [
            ("Welcome to Kortix", "Welcome to Adentic"),
            ("kortix.ai", "adentic.ai"),
            ("KORTIX PLATFORM", "ADENTIC PLATFORM"),
            ("Visit Kortix at kortix.com", "Visit Adentic at adentic.com"),
        ]

        for input_text, expected in test_cases:
            result = get_brand_replaced_text(input_text)
            assert result == expected

    def test_preserve_non_brand_text(self):
        """Test that non-brand text is preserved"""
        text = "This is a normal sentence without brand names"
        result = get_brand_replaced_text(text)
        assert result == text

    def test_handle_none_input(self):
        """Test that None input returns None"""
        result = get_brand_replaced_text(None)
        assert result is None

    def test_handle_empty_string(self):
        """Test that empty string returns empty string"""
        result = get_brand_replaced_text("")
        assert result == ""


class TestEmailTemplateIntegration:
    """Test email template brand integration"""

    def test_email_template_uses_config(self):
        """Test that email templates can use brand config"""
        config = EmailBrandConfig()

        # Simulate email template rendering
        template = f"""
        <h1>Welcome to {config.brand_name}</h1>
        <p style="color: {config.primary_color}">Thank you for joining!</p>
        <img src="{config.logo_url}" alt="{config.brand_name} Logo">
        <footer>{config.copyright_text}</footer>
        """

        assert "Adentic" in template
        assert "#CC3A00" in template
        assert "adentic.com" in template
        assert "© 2025 Adentic" in template
        assert "Kortix" not in template

    def test_config_is_dataclass(self):
        """Test that EmailBrandConfig is a proper dataclass"""
        config = EmailBrandConfig()

        # Should have dataclass fields
        field_names = [f.name for f in fields(config)]
        assert "brand_name" in field_names
        assert "primary_color" in field_names
        assert "logo_url" in field_names
        assert "copyright_text" in field_names

    def test_config_immutability(self):
        """Test that config values can be set but recommend using defaults"""
        config = EmailBrandConfig()
        original_name = config.brand_name

        # Dataclass allows modification but we use defaults
        config.brand_name = "TestBrand"
        assert config.brand_name == "TestBrand"

        # New instance should have default
        new_config = EmailBrandConfig()
        assert new_config.brand_name == original_name