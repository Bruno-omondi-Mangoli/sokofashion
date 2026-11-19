/*
 * Development seed. Recreates test accounts and sample shops on the LOCAL
 * database after a reset, using the same functions the real app uses.
 *
 * It refuses to run against anything except the local database, because it
 * creates accounts with a known password.
 *
 * Run it with: npm run db:seed
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appEnv = process.env.APP_ENV ?? 'local';

const PASSWORD = 'Password123!';

function stop(message) {
  console.error(`Seed stopped: ${message}`);
  process.exit(1);
}

if (!url || !publishableKey || !serviceKey) {
  stop(
    'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local.',
  );
}

/* Safety: only ever run against the database on this laptop */
const host = new URL(url).hostname;
if (appEnv !== 'local' || (host !== '127.0.0.1' && host !== 'localhost')) {
  stop('this script only runs against the local database. Nothing was changed.');
}

/*
 * After a database reset the API can take a few seconds to come back. Any
 * answer at all means it is up, so only network errors are retried.
 */
async function waitForApi() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await fetch(`${url}/auth/v1/health`, { headers: { apikey: publishableKey } });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  stop('the local Supabase API did not answer. Run npm run db:start and try again.');
}

const clientOptions = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(url, serviceKey, clientOptions);

const shops = [
  {
    ownerEmail: 'owner1@example.test',
    name: 'Mama Njeri Fashion',
    slug: 'mama-njeri',
    products: [
      {
        name: 'Kitenge Dress',
        category: 'clothes',
        priceMinor: 350000,
        description: 'A bright kitenge dress for any occasion.',
        sizes: ['S', 'M', 'L'],
        colours: ['Red', 'Blue'],
      },
      {
        name: 'Ankara Top',
        category: 'clothes',
        priceMinor: 180000,
        description: 'Light ankara top with a relaxed fit.',
        sizes: ['M', 'L', 'XL'],
        colours: ['Green'],
      },
    ],
  },
  {
    ownerEmail: 'owner2@example.test',
    name: 'Zuri Shoes',
    slug: 'zuri-shoes',
    products: [
      {
        name: 'Leather Sandals',
        category: 'shoes',
        priceMinor: 250000,
        description: 'Soft leather sandals.',
        sizes: ['38', '39', '40'],
        colours: ['Black', 'Brown'],
      },
      {
        name: 'Heeled Pumps',
        category: 'shoes',
        priceMinor: 320000,
        description: 'Comfortable mid heel pumps.',
        sizes: ['37', '38', '39', '40'],
        colours: ['Black'],
      },
    ],
  },
  {
    ownerEmail: 'owner3@example.test',
    name: 'Amani Bags',
    slug: 'amani-bags',
    products: [
      {
        name: 'Woven Tote Bag',
        category: 'bags',
        priceMinor: 220000,
        description: 'A roomy woven tote.',
        sizes: [],
        colours: ['Brown', 'Beige'],
      },
      {
        name: 'Mini Crossbody',
        category: 'bags',
        priceMinor: 280000,
        description: 'Small crossbody for the essentials.',
        sizes: [],
        colours: ['Black'],
      },
    ],
  },
];

const attendantEmail = 'attendant1@example.test';
const attendantShopSlug = 'mama-njeri';

async function ensureUser(email) {
  const { error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  const alreadyExists =
    error && (error.code === 'email_exists' || /already (been )?registered/i.test(error.message));
  if (error && !alreadyExists) {
    stop(`could not create ${email}: ${error.message}`);
  }
}

async function signIn(email) {
  const client = createClient(url, publishableKey, clientOptions);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) {
    stop(`could not sign in as ${email}: ${error.message}`);
  }
  return client;
}

/* Every combination of sizes and colours, with a small stock number each */
function buildVariants(product) {
  const sizes = product.sizes.length > 0 ? product.sizes : [null];
  const colours = product.colours.length > 0 ? product.colours : [null];
  const variants = [];
  for (const size of sizes) {
    for (const colour of colours) {
      variants.push({ size, colour, opening_stock: 4 + (variants.length % 5) });
    }
  }
  return variants;
}

/* Mini Crossbody stays a draft on purpose, so the public page shows that drafts are hidden */
const keepDraft = new Set(['Mini Crossbody']);

/* Three photo shapes (portrait, square, landscape) so the page proves photos show whole */
const shapes = [
  [800, 1200],
  [900, 900],
  [1200, 800],
];
const colours = [
  { r: 42, g: 46, b: 122 },
  { r: 232, g: 163, b: 23 },
  { r: 191, g: 49, b: 96 },
  { r: 18, g: 128, b: 120 },
];

async function addSamplePhotos(shopId, productId, owner, count, seedNumber) {
  for (let n = 0; n < count; n += 1) {
    const [width, height] = shapes[(seedNumber + n) % shapes.length];
    const background = colours[(seedNumber + n) % colours.length];
    const scale = 400 / Math.max(width, height);
    const thumbWidth = Math.round(width * scale);
    const thumbHeight = Math.round(height * scale);

    const main = await sharp({ create: { width, height, channels: 3, background } })
      .jpeg({ quality: 70 })
      .toBuffer();
    const thumb = await sharp({
      create: { width: thumbWidth, height: thumbHeight, channels: 3, background },
    })
      .jpeg({ quality: 70 })
      .toBuffer();

    const imageId = randomUUID();
    const folder = `${shopId}/${productId}`;
    const uploads = [
      [`${folder}/${imageId}.jpg`, main],
      [`${folder}/${imageId}_t.jpg`, thumb],
    ];
    for (const [filePath, buffer] of uploads) {
      const { error } = await admin.storage
        .from('product-images')
        .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true });
      if (error) {
        stop(`could not upload a sample photo: ${error.message}`);
      }
    }

    const { error } = await owner.rpc('add_product_image', {
      target_product_id: productId,
      new_image_id: imageId,
      image_ext: 'jpg',
      image_width: width,
      image_height: height,
    });
    if (error) {
      stop(`could not register a sample photo: ${error.message}`);
    }
  }
}

async function addPhotosAndGoLive(shop, shopId, owner) {
  const { data: rows, error } = await owner
    .from('products')
    .select('id, name')
    .eq('shop_id', shopId);
  if (error) {
    stop(`could not read the new products: ${error.message}`);
  }

  for (const [index, product] of shop.products.entries()) {
    const row = (rows ?? []).find((item) => item.name === product.name);
    if (!row) {
      stop(`could not find ${product.name} after creating it.`);
    }
    await addSamplePhotos(shopId, row.id, owner, (index % 3) + 1, index);

    if (!keepDraft.has(product.name)) {
      const { error: liveError } = await owner
        .from('products')
        .update({ status: 'active' })
        .eq('id', row.id);
      if (liveError) {
        stop(`could not make ${product.name} live: ${liveError.message}`);
      }
    }
  }
}

async function seedShop(shop) {
  await ensureUser(shop.ownerEmail);
  const owner = await signIn(shop.ownerEmail);

  const { data: existing, error: lookupError } = await owner
    .from('shops')
    .select('id')
    .eq('slug', shop.slug)
    .maybeSingle();
  if (lookupError) {
    stop(`could not look up ${shop.slug}: ${lookupError.message}`);
  }
  if (existing) {
    console.log(`Shop ${shop.slug} already exists, skipped.`);
    return { shopId: existing.id, owner };
  }

  const { data: shopId, error: shopError } = await owner.rpc('create_shop', {
    shop_name: shop.name,
    shop_slug: shop.slug,
    shop_country_code: 'KE',
  });
  if (shopError) {
    stop(`could not create ${shop.slug}: ${shopError.message}`);
  }

  for (const product of shop.products) {
    const { error } = await owner.rpc('create_product', {
      target_shop_id: shopId,
      product_name: product.name,
      product_category: product.category,
      product_price_minor: product.priceMinor,
      product_description: product.description,
      initial_status: 'draft',
      variant_list: buildVariants(product),
    });
    if (error) {
      stop(`could not create ${product.name}: ${error.message}`);
    }
  }
  await addPhotosAndGoLive(shop, shopId, owner);
  console.log(`Created shop ${shop.slug} with ${shop.products.length} products.`);
  return { shopId, owner };
}

async function seedAttendant(shopsBySlug) {
  await ensureUser(attendantEmail);
  const target = shopsBySlug.get(attendantShopSlug);
  if (!target) {
    return;
  }

  const { error: inviteError } = await target.owner.rpc('invite_staff', {
    target_shop_id: target.shopId,
    invitee_email: attendantEmail,
    invitee_role: 'attendant',
  });
  /* 23505 means already invited or already on the team, which is fine */
  if (inviteError && inviteError.code !== '23505') {
    stop(`could not invite the attendant: ${inviteError.message}`);
  }

  const attendant = await signIn(attendantEmail);
  const { data: invitations, error: listError } = await attendant.rpc('my_pending_invitations');
  if (listError) {
    stop(`could not read invitations: ${listError.message}`);
  }
  for (const invitation of invitations ?? []) {
    const { error } = await attendant.rpc('accept_invitation', {
      target_invitation_id: invitation.invitation_id,
    });
    if (error) {
      stop(`could not accept the invitation: ${error.message}`);
    }
  }
  console.log(`Attendant ${attendantEmail} is on the team of ${attendantShopSlug}.`);
}

await waitForApi();

const shopsBySlug = new Map();
for (const shop of shops) {
  const result = await seedShop(shop);
  shopsBySlug.set(shop.slug, result);
}
await seedAttendant(shopsBySlug);

console.log('');
console.log('Test accounts (all use the same password):');
console.log(`  password: ${PASSWORD}`);
for (const shop of shops) {
  console.log(`  ${shop.ownerEmail}  owner of ${shop.name}`);
}
console.log(`  ${attendantEmail}  attendant at Mama Njeri Fashion`);
