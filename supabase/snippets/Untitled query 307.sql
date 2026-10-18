alter table public.products disable row level security;

grant update on public.stock_movements to authenticated;