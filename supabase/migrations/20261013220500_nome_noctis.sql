-- Nome da marca: Injection -> Noctis (títulos que aparecem no checkout do Mercado Pago)
update public.precos set titulo = replace(titulo, 'Injection ', 'Noctis ') where titulo like 'Injection %';
