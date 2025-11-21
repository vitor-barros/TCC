// data/mockCards.ts
import { Card } from "@/model/Card";

export const mockCardsRaw = [
  { id: "1", title: "Revolução Francesa", imageUrl: "https://placecats.com/300/150", year: 1789 },
  { id: "2", title: "Queda do Muro de Berlim", imageUrl: "https://placecats.com/300/151", year: 1989 },
  { id: "3", title: "Descoberta da América", imageUrl: "https://placecats.com/300/152", year: 1492 },
  { id: "4", title: "Independência dos Estados Unidos", imageUrl: "https://placecats.com/300/153", year: 1776 },
  { id: "5", title: "Invenção da Imprensa (Gutenberg)", imageUrl: "https://placecats.com/300/154", year: 1440 },
  { id: "6", title: "Queda de Constantinopla", imageUrl: "https://placecats.com/300/155", year: 1453 },
  { id: "7", title: "Primeira Guerra Mundial", imageUrl: "https://placecats.com/300/156", year: 1914 },
  { id: "8", title: "Segunda Guerra Mundial", imageUrl: "https://placecats.com/300/157", year: 1939 },
  { id: "9", title: "Independência do Brasil", imageUrl: "https://placecats.com/300/158", year: 1822 },
  { id: "10", title: "Proclamação da República (Brasil)", imageUrl: "https://placecats.com/300/159", year: 1889 },
  { id: "11", title: "Ataque a Pearl Harbor", imageUrl: "https://placecats.com/300/160", year: 1941 },
  { id: "12", title: "Primeira Viagem à Lua (Apollo 11)", imageUrl: "https://placecats.com/300/161", year: 1969 },
  { id: "13", title: "Início da Guerra Fria", imageUrl: "https://placecats.com/300/162", year: 1947 },
  { id: "14", title: "Queda do Império Romano (Ocidente)", imageUrl: "https://placecats.com/300/163", year: 476 },
  { id: "15", title: "Tratado de Versalhes", imageUrl: "https://placecats.com/300/164", year: 1919 },
  { id: "16", title: "Revolução Industrial (inicio aproximado)", imageUrl: "https://placecats.com/300/165", year: 1760 },
  { id: "17", title: "Primeiro Computador (ENIAC)", imageUrl: "https://placecats.com/300/166", year: 1945 },
  { id: "18", title: "ARPANET / início da Internet", imageUrl: "https://placecats.com/300/167", year: 1969 },
  { id: "19", title: "Início da Reforma Protestante (Lutero)", imageUrl: "https://placecats.com/300/168", year: 1517 },
  { id: "20", title: "Independência do México", imageUrl: "https://placecats.com/300/169", year: 1810 },
  { id: "21", title: "Fim do Apartheid (África do Sul)", imageUrl: "https://placecats.com/300/170", year: 1994 },
  { id: "22", title: "Invenção do Telégrafo", imageUrl: "https://placecats.com/300/171", year: 1837 },
  { id: "23", title: "Invenção do Telefone (Bell)", imageUrl: "https://placecats.com/300/172", year: 1876 },
  { id: "24", title: "Primeiro Voo dos Irmãos Wright", imageUrl: "https://placecats.com/300/173", year: 1903 },
  { id: "25", title: "Quebra da Bolsa de Nova York (1929)", imageUrl: "https://placecats.com/300/174", year: 1929 },
  { id: "26", title: "Unificação da Alemanha", imageUrl: "https://placecats.com/300/175", year: 1871 },
  { id: "27", title: "Unificação da Itália", imageUrl: "https://placecats.com/300/176", year: 1861 },
  { id: "28", title: "Descoberta da Penicilina", imageUrl: "https://placecats.com/300/177", year: 1928 },
  { id: "29", title: "Bombas atômicas — Hiroshima", imageUrl: "https://placecats.com/300/178", year: 1945 },
  { id: "30", title: "Criação da ONU", imageUrl: "...", year: 1945 },
];

// helper que produz instancias das cartas.
export function getMockCardsAsCardModels(): Card[] {
  return mockCardsRaw.map((c) => new Card(c.id, c.title, c.imageUrl, c.year));
}
