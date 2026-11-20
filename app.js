const get = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const phone = matchMedia('(max-width: 700px)');
const menuLayout = matchMedia('(max-width: 840px)');
const ease = 'cubic-bezier(.22,1,.36,1)';

function play(element, frames, duration, delay = 0) {
  element.getAnimations().filter(animation => animation.id === 'fonn').forEach(animation => animation.cancel());
  if (reduced.matches) return;
  const animation = element.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
  animation.id = 'fonn';
  return animation;
}

function revealOpening() {
  if (scrollY > 40 || location.hash || reduced.matches) return;
  const delay = document.documentElement.classList.contains('intro-entry') ? 350 : 0;
  document.querySelectorAll('.hero h1 b').forEach((line, index) => {
    play(line, [{ transform: 'translateY(96%)' }, { transform: 'none' }], 720, delay + index * 90);
  });
  play(document.querySelector('.hero-material'), [{ clipPath: `inset(0 0 ${phone.matches ? 10 : 18}% 0)` }, { clipPath: 'inset(0)' }], 880, delay);
  for (const selector of ['.mast-inner', '.choices']) {
    play(document.querySelector(selector), [{ opacity: .76 }, { opacity: 1 }], 400, delay);
  }
}
revealOpening();

const menu = get('menu');
const menuButton = document.querySelector('.menu-toggle');
function toggleMenu(open, returnFocus = false) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Loka valmynd' : 'Opna valmynd');
  menu.classList.toggle('open', open);
  menu.inert = menuLayout.matches && !open;
  if (returnFocus) menuButton.focus();
}
toggleMenu(false);
menuLayout.addEventListener('change', () => toggleMenu(false));
menuButton.addEventListener('click', () => toggleMenu(menu.inert));
menu.addEventListener('click', event => {
  if (menuLayout.matches && event.target.closest('a')) toggleMenu(false, true);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) toggleMenu(false, true);
});

const services = [
  {
    id: 'lin', name: 'Lín fyrir gististaði', image: 'linen.jpg', alt: 'Samanbrotið hvítt lín',
    description: 'Rúmföt og handklæði fyrir hótel og gististaði. Veldu leigu, þvott á eigin líni eða fáðu aðstoð við valið.',
    options: ['Leigja lín', 'Þvo eigið lín', 'Óska eftir ráðgjöf'], quantity: 'Fjöldi herbergja'
  },
  {
    id: 'dukar', name: 'Dúkar og servéttur', image: 'table.jpg', alt: 'Veisluborð með hvítum dúkum og servéttum',
    description: 'Borðdúkar og servéttur til skemmri eða lengri tíma fyrir veitingahús og veislur.',
    options: ['140 × 140 cm', '140 × 210 cm', '230 × 230 cm', 'Óska eftir ráðgjöf'],
    quantity: 'Fjöldi dúka', date: true
  },
  {
    id: 'mottur', name: 'Mottur við innganginn', image: 'mats.jpg', alt: 'Gólfmottur við inngang',
    description: 'Fyrir fyrirtæki, stofnanir og húsfélög. Við sækjum óhreinu motturnar og setjum hreinar í staðinn.',
    options: ['85 × 150 cm', '115 × 200 cm', '150 × 250 cm', 'Óska eftir ráðgjöf'], quantity: 'Fjöldi motta'
  }
];
const tabs = [...document.querySelectorAll('[role=tab]')];
const choice = get('service-choice');
let active = 0;

function setOptions(select, options) {
  select.replaceChildren(...options.map(value => new Option(value, value)));
}

function selectService(index, updateHash = false, animate = false) {
  active = index;
  const service = services[index];
  for (const [i, tab] of tabs.entries()) {
    tab.setAttribute('aria-selected', String(index === i));
    tab.tabIndex = index === i ? 0 : -1;
  }
  get('service').setAttribute('aria-labelledby', tabs[index].id);
  const photo = get('service-image');
  photo.src = 'assets/' + service.image;
  photo.alt = service.alt;
  get('service-name').textContent = service.name;
  get('service-description').textContent = service.description;
  setOptions(choice, service.options);
  if (updateHash) history.replaceState(null, '', '#' + service.id);
  if (animate) {
    play(photo, [{ clipPath: 'inset(0 9% 0 0)', opacity: .55 }, { clipPath: 'inset(0)', opacity: 1 }], 320);
    play(get('service-name'), [{ transform: 'translateX(-6px)' }, { transform: 'none' }], 220);
  }
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => {
    if (index !== active) selectService(index, true, true);
  });
  tab.addEventListener('keydown', event => {
    const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectService(next, true, true);
    tabs[next].focus();
  });
}

function readServiceHash() {
  const index = services.findIndex(service => '#' + service.id === location.hash);
  if (index < 0) return;
  selectService(index);
  get('fyrirtaeki').scrollIntoView({ behavior: 'instant' });
}
window.addEventListener('hashchange', readServiceHash);
readServiceHash();

const prices = [
  ['Skyrta (þvottur)', '1.110'], ['Buxur', '2.678'], ['Jakki', '2.678'],
  ['Kjóll', '4.521'], ['Kápa', '4.820'], ['Blússa', '3.284'],
  ['Buxur í pressun', '2.051'], ['Jakki í pressun', '2.051'], ['Peysa', '1.950'],
  ['Pils', '2.678'], ['Bindi', '1.272'], ['Vesti', '1.504'], ['Frakki', '4.820']
];
const priceSearch = get('price-search');
const priceExtra = get('price-extra');
const priceToggle = document.querySelector('.price-toggle');
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function renderList(list, rows) {
  list.replaceChildren(...rows.map(([name, price]) => {
    const row = document.createElement('li');
    row.textContent = name;
    if (price) {
      const amount = document.createElement('b');
      amount.textContent = price + ' kr.';
      row.append(amount);
    }
    return row;
  }));
}
function expandPrices(expanded) {
  priceExtra.classList.toggle('open', expanded);
  priceExtra.inert = !expanded;
  priceToggle.setAttribute('aria-expanded', String(expanded));
  priceToggle.firstChild.textContent = expanded ? 'Sýna færri verð ' : 'Sjá alla verðskrána ';
}
function searchPrices() {
  const query = normalize(priceSearch.value.trim());
  const rows = query ? prices.filter(([name]) => normalize(name).includes(query)) : prices.slice(0, 5);
  renderList(get('price-primary'), rows.length ? rows : [['Engin flík fannst.']]);
  priceToggle.hidden = Boolean(query);
  priceExtra.hidden = Boolean(query);
  expandPrices(false);
}
renderList(get('price-secondary'), prices.slice(5));
searchPrices();
priceSearch.addEventListener('input', searchPrices);
priceToggle.addEventListener('click', () => expandPrices(priceExtra.inert));

const quote = get('quote');
const quoteInner = quote.querySelector('.dialog-inner');
const quoteButton = get('quote-open');
const form = get('quote-form');
const review = get('quote-review');
const result = get('quote-result');
const closeButton = quote.querySelector('.dialog-close');
let closeAnimation;

quoteButton.addEventListener('click', () => {
  const service = services[active];
  form.reset();
  form.hidden = false;
  review.hidden = true;
  result.hidden = true;
  setOptions(form.elements.kind, service.options);
  form.elements.kind.value = choice.value;
  get('quantity-label').textContent = service.quantity;
  get('date-field').hidden = !service.date;
  form.elements.date.disabled = !service.date;
  quote.showModal();
  quoteInner.focus({ preventScroll: true });
  play(quote, [{ opacity: .5, transform: 'translateY(-18px)' }, { opacity: 1, transform: 'none' }], 260);
});
function dismissQuote() {
  if (closeAnimation?.playState === 'running') return;
  if (reduced.matches) {
    quote.close();
    return;
  }
  const style = getComputedStyle(quote);
  closeAnimation = play(quote, [{ opacity: style.opacity, transform: style.transform }, { opacity: .5, transform: 'translateY(-12px)' }], 180);
  closeAnimation.onfinish = () => quote.close();
}
closeButton.addEventListener('click', dismissQuote);
quote.addEventListener('cancel', event => {
  event.preventDefault();
  dismissQuote();
});
quote.addEventListener('click', event => {
  if (event.target === quote) dismissQuote();
});
quote.addEventListener('close', () => quoteButton.focus({ preventScroll: true }));

form.addEventListener('submit', event => {
  event.preventDefault();
  const labels = { kind: 'Þjónusta', quantity: services[active].quantity, place: 'Staðsetning', date: 'Óskadagur', email: 'Netfang' };
  const rows = [...new FormData(form)].filter(([, value]) => value).map(([key, value]) => {
    const row = document.createElement('div');
    const title = document.createElement('dt');
    const detail = document.createElement('dd');
    title.textContent = labels[key];
    detail.textContent = value;
    row.append(title, detail);
    return row;
  });
  get('quote-data').replaceChildren(...rows);
  form.hidden = true;
  review.hidden = false;
  get('quote-edit').focus();
  play(review, [{ transform: 'translateY(6px)' }, { transform: 'none' }], 180);
});
get('quote-edit').addEventListener('click', () => {
  review.hidden = true;
  form.hidden = false;
  form.elements.kind.focus();
  play(form, [{ transform: 'translateY(6px)' }, { transform: 'none' }], 180);
});
get('quote-done').addEventListener('click', () => {
  review.hidden = true;
  result.hidden = false;
  closeButton.focus();
});

const mapStage = get('map-stage');
const mapFrame = get('map-frame');
const mapToggle = mapStage.querySelector('.map-toggle');
const mapEmbed = mapFrame.querySelector('iframe');
mapToggle.hidden = false;
function setMapOpen(open) {
  if (open && !mapEmbed.hasAttribute('src')) mapEmbed.src = mapEmbed.dataset.src;
  mapStage.classList.toggle('is-open', open);
  mapFrame.inert = !open;
  mapToggle.setAttribute('aria-expanded', String(open));
  mapToggle.firstChild.textContent = open ? 'Fela kort ' : 'Sýna kort ';
}
mapToggle.addEventListener('click', () => setMapOpen(mapFrame.inert));

const workshop = document.querySelector('.workshop');
const mediaFrame = document.querySelector('.workshop-media');
const workshopCopy = document.querySelector('.workshop-copy');
let queued = false;
function renderFold() {
  queued = false;
  if (reduced.matches) return;
  const top = workshop.getBoundingClientRect().top;
  const remaining = Math.max(0, Math.min(1, (top / innerHeight - .18) / .82));
  mediaFrame.style.setProperty('--fold-x', remaining * 14 + '%');
  mediaFrame.style.setProperty('--fold-y', remaining * 10 + '%');
  workshopCopy.style.setProperty('--caption-shift', remaining * (phone.matches ? 10 : 18) + 'px');
}
function queueFold() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(renderFold);
}
window.addEventListener('scroll', queueFold, { passive: true });
window.addEventListener('resize', queueFold);
if ('IntersectionObserver' in window) {
  const reveals = new Map([
    [document.querySelector('.visit-rule'), [[{ transform: 'scaleX(0)' }, { transform: 'none' }], 550]],
    [document.querySelector('.review-fill'), [[{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 8% 0 0)' }], 700]],
    [document.querySelector('.visit-map'), [[{ clipPath: 'inset(9% 0 0)' }, { clipPath: 'inset(0)' }], 560]]
  ]);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      play(entry.target, ...reveals.get(entry.target));
    }
  }, { threshold: .15 });
  for (const target of reveals.keys()) observer.observe(target);
}
reduced.addEventListener('change', () => {
  if (reduced.matches) {
    if (closeAnimation?.playState === 'running') quote.close();
    document.getAnimations().filter(animation => animation.id === 'fonn').forEach(animation => animation.cancel());
  }
  queueFold();
});
queueFold();
