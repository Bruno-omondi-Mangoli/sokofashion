# Data model reference

Updated with every migration. Money is stored as whole numbers in the smallest unit, with a currency code.

## countries

Reference data shared by all shops. Not tenant owned, so it has no shop_id.

- code: two letter country code, primary key
- name: country name
- currency_code: three letter currency code
- currency_minor_units: decimal places of the currency
- default_language: en or sw
- is_active: whether shops can be created in this country
- created_at: when the row was created

Row Level Security: everyone may read. Nobody may write through the public API.
