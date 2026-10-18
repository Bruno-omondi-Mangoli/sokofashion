/*
 * Choices shown on the add product form. The categories themselves live in the
 * database, so this file only holds the suggestions for sizes and colours.
 */

export const sizePresets: Record<string, string[]> = {
  clothes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  bags: [],
  cosmetics: [],
};

export const colourPresets: string[] = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Pink',
  'Brown',
  'Grey',
  'Purple',
  'Orange',
  'Beige',
];

export const sizeHelp = 'S is small, M is medium, L is large, XL is extra large';
