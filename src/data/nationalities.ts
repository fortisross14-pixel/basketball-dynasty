// ═══ Player nationalities & per-country name pools ═══
import type { Nationality } from '../engine/types';

export interface NationProfile {
  nat: Nationality;
  weight: number;        // relative draw frequency
  first: string[];
  last: string[];
}

// ~65% USA, ~35% international across real basketball nations.
export const NATIONS: NationProfile[] = [
  {
    nat: { country: 'USA', abbr: 'USA', flag: '🇺🇸' },
    weight: 65,
    first: [
      'Marcus', 'Theo', 'Darius', 'Andre', 'Trey', 'Malik', 'Jaylen', 'Caleb', 'Devin',
      'Isaiah', 'Quentin', 'Xavier', 'Damon', 'Brock', 'Tyrell', 'Donovan', 'Reggie',
      'Cole', 'Jaxon', 'Travis', 'Bryce', 'Khalil', 'Jamal', 'Grant', 'Cassius', 'Dexter',
      'DeShawn', 'Tyrese', 'Jalen', 'Cam', 'Anthony', 'Terrence',
    ],
    last: [
      'Hale', 'King', 'Cross', 'Vaughn', 'Brooks', 'Mercer', 'Stone', 'Tate', 'Sloan',
      'Archer', 'Boone', 'Hayes', 'Rhodes', 'Slade', 'Welch', 'Calloway', 'Ellison',
      'Holt', 'Jennings', 'Maddox', 'Pruitt', 'Ramsey', 'Sterling', 'Whitfield', 'Banner',
      'Carter', 'Jackson', 'Coleman', 'Freeman', 'Harris',
    ],
  },
  {
    nat: { country: 'Slovenia', abbr: 'SLO', flag: '🇸🇮' },
    weight: 4,
    first: ['Luka', 'Goran', 'Vlatko', 'Klemen', 'Edo', 'Žiga', 'Jaka', 'Matic'],
    last: ['Dragić', 'Prepelič', 'Čančar', 'Murić', 'Blažič', 'Nikolić', 'Tobey', 'Hrovat'],
  },
  {
    nat: { country: 'Serbia', abbr: 'SRB', flag: '🇷🇸' },
    weight: 5,
    first: ['Nikola', 'Bogdan', 'Vasilije', 'Aleksej', 'Marko', 'Stefan', 'Filip', 'Nemanja'],
    last: ['Jokić', 'Bogdanović', 'Micić', 'Pokuševski', 'Marjanović', 'Petrušev', 'Avramović', 'Gudurić'],
  },
  {
    nat: { country: 'Greece', abbr: 'GRE', flag: '🇬🇷' },
    weight: 3,
    first: ['Giannis', 'Thanasis', 'Kostas', 'Vassilis', 'Nikos', 'Dimitris', 'Georgios'],
    last: ['Antetokounmpo', 'Sloukas', 'Papanikolaou', 'Calathes', 'Dorsey', 'Larentzakis', 'Mitoglou'],
  },
  {
    nat: { country: 'Spain', abbr: 'ESP', flag: '🇪🇸' },
    weight: 4,
    first: ['Pau', 'Marc', 'Ricky', 'Sergio', 'Juancho', 'Willy', 'Usman', 'Santi', 'Álex'],
    last: ['Gasol', 'Rubio', 'Hernangómez', 'Garuba', 'Aldama', 'Brizuela', 'Yusta', 'Saint-Supéry'],
  },
  {
    nat: { country: 'Germany', abbr: 'GER', flag: '🇩🇪' },
    weight: 3,
    first: ['Dirk', 'Dennis', 'Daniel', 'Maxi', 'Moritz', 'Franz', 'Isaac', 'Andreas'],
    last: ['Nowitzki', 'Schröder', 'Theis', 'Kleber', 'Wagner', 'Bonga', 'Obst', 'Voigtmann'],
  },
  {
    nat: { country: 'France', abbr: 'FRA', flag: '🇫🇷' },
    weight: 4,
    first: ['Tony', 'Victor', 'Rudy', 'Nicolas', 'Evan', 'Frank', 'Théo', 'Killian', 'Ousmane'],
    last: ['Parker', 'Wembanyama', 'Gobert', 'Batum', 'Fournier', 'Ntilikina', 'Maledon', 'Hayes'],
  },
  {
    nat: { country: 'Argentina', abbr: 'ARG', flag: '🇦🇷' },
    weight: 2,
    first: ['Manu', 'Luis', 'Facundo', 'Gabriel', 'Patricio', 'Nicolás', 'Leandro'],
    last: ['Ginóbili', 'Scola', 'Campazzo', 'Deck', 'Garino', 'Laprovíttola', 'Bolmaro'],
  },
  {
    nat: { country: 'Cameroon', abbr: 'CMR', flag: '🇨🇲' },
    weight: 2,
    first: ['Joel', 'Pascal', 'Christian', 'Landry', 'Yves', 'Patrick'],
    last: ['Embiid', 'Siakam', 'Mbah a Moute', 'Fields', 'Nkamhoua', 'Mbala'],
  },
  {
    nat: { country: 'Australia', abbr: 'AUS', flag: '🇦🇺' },
    weight: 2,
    first: ['Patty', 'Joe', 'Ben', 'Josh', 'Matthew', 'Dyson', 'Jock', 'Dante'],
    last: ['Mills', 'Ingles', 'Simmons', 'Giddey', 'Dellavedova', 'Daniels', 'Landale', 'Exum'],
  },
  {
    nat: { country: 'Canada', abbr: 'CAN', flag: '🇨🇦' },
    weight: 3,
    first: ['Shai', 'Jamal', 'Andrew', 'RJ', 'Dillon', 'Lu', 'Trey', 'Kelly'],
    last: ['Gilgeous-Alexander', 'Murray', 'Wiggins', 'Barrett', 'Brooks', 'Dort', 'Lyles', 'Olynyk'],
  },
  {
    nat: { country: 'Lithuania', abbr: 'LTU', flag: '🇱🇹' },
    weight: 2,
    first: ['Domantas', 'Jonas', 'Arvydas', 'Šarūnas', 'Mindaugas', 'Tadas'],
    last: ['Sabonis', 'Valančiūnas', 'Kuzminskas', 'Jasikevičius', 'Kuzminskas', 'Sedekerskis'],
  },
  {
    nat: { country: 'Croatia', abbr: 'CRO', flag: '🇭🇷' },
    weight: 2,
    first: ['Dario', 'Bojan', 'Ivica', 'Mario', 'Dragan', 'Krunoslav'],
    last: ['Šarić', 'Bogdanović', 'Zubac', 'Hezonja', 'Bender', 'Šimić'],
  },
  {
    nat: { country: 'Nigeria', abbr: 'NGA', flag: '🇳🇬' },
    weight: 2,
    first: ['Hakeem', 'Precious', 'Josh', 'Chima', 'Gabe', 'Miye', 'Stanley'],
    last: ['Olajuwon', 'Achiuwa', 'Okogie', 'Moneke', 'Vincent', 'Oni', 'Umude'],
  },
  {
    nat: { country: 'Brazil', abbr: 'BRA', flag: '🇧🇷' },
    weight: 1,
    first: ['Leandro', 'Anderson', 'Tiago', 'Raul', 'Cristiano', 'Bruno'],
    last: ['Barbosa', 'Varejão', 'Splitter', 'Neto', 'Felício', 'Caboclo'],
  },
];

const TOTAL_WEIGHT = NATIONS.reduce((s, n) => s + n.weight, 0);

/** Weighted random nationality profile. `rand` is a [0,1) value. */
export function pickNation(rand: number): NationProfile {
  let r = rand * TOTAL_WEIGHT;
  for (const n of NATIONS) {
    if (r < n.weight) return n;
    r -= n.weight;
  }
  return NATIONS[0];
}
