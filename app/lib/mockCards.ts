// data/mockCards.ts
import { Card } from "@/model/Card";

export const mockCardsRaw = [
  { id: "1", title: "Revolução Francesa", imageUrl: "/images/carta01.jpg", year: 1789 },
  { id: "2", title: "Queda do Muro de Berlim", imageUrl: "/images/carta02.jpg", year: 1989 },
  { id: "3", title: "Descoberta da América", imageUrl: "/images/carta03.jpg", year: 1492 },
  { id: "4", title: "Independência dos Estados Unidos", imageUrl: "/images/carta04.jpg", year: 1776 },
  { id: "5", title: "Invenção da Imprensa (Gutenberg)", imageUrl: "/images/carta05.jpg", year: 1440 },
  { id: "6", title: "Queda de Constantinopla", imageUrl: "/images/carta06.jpg", year: 1453 },
  { id: "7", title: "Primeira Guerra Mundial", imageUrl: "/images/carta07.jpg", year: 1914 },
  { id: "8", title: "Segunda Guerra Mundial", imageUrl: "/images/carta08.jpg", year: 1939 },
  { id: "9", title: "Independência do Brasil", imageUrl: "/images/carta09.jpg", year: 1822 },
  { id: "10", title: "Proclamação da República (Brasil)", imageUrl: "/images/carta10.jpg", year: 1889 },
  { id: "11", title: "Ataque a Pearl Harbor", imageUrl: "/images/carta11.jpg", year: 1941 },
  { id: "12", title: "Primeira Viagem à Lua (Apollo 11)", imageUrl: "/images/carta12.jpg", year: 1969 },
  { id: "13", title: "Início da Guerra Fria", imageUrl: "/images/carta13.jpg", year: 1947 },
  { id: "14", title: "Queda do Império Romano (Ocidente)", imageUrl: "/images/carta14.png", year: 476 },
  { id: "15", title: "Tratado de Versalhes", imageUrl: "/images/carta15.jpg", year: 1919 },
  { id: "16", title: "Revolução Industrial (inicio aproximado)", imageUrl: "/images/carta16.jpg", year: 1760 },
  { id: "17", title: "Primeiro Computador (ENIAC)", imageUrl: "/images/carta17.jpg", year: 1945 },
  { id: "18", title: "ARPANET / início da Internet", imageUrl: "/images/carta18.jpg", year: 1969 },
  { id: "19", title: "Início da Reforma Protestante (Lutero)", imageUrl: "/images/carta19.jpg", year: 1517 },
  { id: "20", title: "Independência do México", imageUrl: "/images/carta20.jpg", year: 1810 },
  { id: "21", title: "Fim do Apartheid (África do Sul)", imageUrl: "/images/carta21.jpg", year: 1994 },
  { id: "22", title: "Invenção do Telégrafo", imageUrl: "/images/carta22.jpg", year: 1837 },
  { id: "23", title: "Invenção do Telefone (Bell)", imageUrl: "/images/carta23.jpg", year: 1876 },
  { id: "24", title: "Primeiro Voo dos Irmãos Wright", imageUrl: "/images/carta24.jpg", year: 1903 },
  { id: "25", title: "Quebra da Bolsa de Nova York", imageUrl: "/images/carta25.jpg", year: 1929 },
  { id: "26", title: "Unificação da Alemanha", imageUrl: "/images/carta26.jpg", year: 1871 },
  { id: "27", title: "Unificação da Itália", imageUrl: "/images/carta27.jpg", year: 1861 },
  { id: "28", title: "Descoberta da Penicilina", imageUrl: "/images/carta28.jpg", year: 1928 },
  { id: "29", title: "Bombas atômicas — Hiroshima", imageUrl: "/images/carta29.jpg", year: 1945 },
  { id: "30", title: "Criação da ONU", imageUrl: "/images/carta30.jpg", year: 1945 },
];

// helper que produz instancias das cartas.
export function getMockCardsAsCardModels(): Card[] {
  return mockCardsRaw.map((c) => new Card(c.id, c.title, c.imageUrl, c.year));
}