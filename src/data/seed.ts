import type { Item, PlannerData, Section } from '../types'

const createItems = (sectionId: string, titles: string[]): Item[] => {
  return titles.map((title, index) => ({
    id: `item-${sectionId}-${index + 1}`,
    title,
    checked: false,
    favorite: false,
    status: 'Do zrobienia',
    dueDate: '',
    cost: undefined,
    costPaid: false,
    notes: [],
  }))
}

export const createSeedData = (): PlannerData => {
  const sections: Section[] = [
    {
      id: '1',
      title: 'Wstepne ustalenia',
      items: createItems('1', [
        'Ustalic budzet slubu i wesela',
        'Ustalic orientacyjna liczbe gosci',
        'Wybrac preferowany termin slubu',
        'Wybrac rodzaj slubu (cywilny / koscielny / konkordatowy)',
        'Wybrac styl / motyw przewodni slubu',
      ]),
    },
    {
      id: '2',
      title: 'Ceremonia i sala',
      items: createItems('2', [
        'Sprawdzic dostepnosc terminow w urzedzie / kosciele',
        'Zarezerwowac termin ceremonii',
        'Wybrac sale weselna',
        'Zarezerwowac sale weselna',
        'Ustalic szczegoly umowy z sala',
      ]),
    },
    {
      id: '3',
      title: 'Goscie',
      items: createItems('3', [
        'Sporzadzic wstepna liste gosci',
        'Wybrac i zamowic zaproszenia slubne',
        'Wypisac i wyslac zaproszenia',
        'Zebrac potwierdzenia obecnosci (RSVP)',
        'Sporzadzic ostateczna liste gosci',
        'Zaplanowac noclegi dla gosci',
        'Zaplanowac transport dla gosci',
      ]),
    },
    {
      id: '4',
      title: 'Oprawa muzyczna i foto/wideo',
      items: createItems('4', [
        'Wybrac fotografa',
        'Zarezerwowac fotografa',
        'Wybrac kamerzyste',
        'Zarezerwowac kamerzyste',
        'Wybrac zespol lub DJ-a',
        'Zarezerwowac zespol lub DJ-a',
      ]),
    },
    {
      id: '5',
      title: 'Stroje i bizuteria',
      items: createItems('5', [
        'Wybrac suknie slubna',
        'Umowic przymiarki sukni slubnej',
        'Wybrac dodatki Panny Mlodej',
        'Wybrac garnitur dla Pana Mlodego',
        'Wybrac obraczki',
        'Zamowic obraczki',
      ]),
    },
    {
      id: '6',
      title: 'Uroda',
      items: createItems('6', [
        'Wybrac fryzure slubna',
        'Umowic probne czesanie',
        'Wybrac makijaz slubny',
        'Umowic probny makijaz',
      ]),
    },
    {
      id: '7',
      title: 'Dekoracje i kwiaty',
      items: createItems('7', [
        'Wybrac floryste',
        'Zamowic bukiet slubny',
        'Zaplanowac dekoracje sali i ceremonii',
      ]),
    },
    {
      id: '8',
      title: 'Jedzenie i napoje',
      items: createItems('8', [
        'Zaplanowac menu weselne',
        'Ustalic i zamowic alkohol i napoje',
        'Wybrac i zamowic tort weselny',
      ]),
    },
    {
      id: '9',
      title: 'Atrakcje i dodatki',
      items: createItems('9', [
        'Zaplanowac atrakcje weselne',
        'Przygotowac upominki dla gosci',
        'Przygotowac plan stolow',
      ]),
    },
    {
      id: '10',
      title: 'Formalnosci',
      items: createItems('10', [
        'Zalatwic formalnosci urzedowe / koscielne',
        'Umowic nauki przedmalzenskie',
      ]),
    },
    {
      id: '11',
      title: 'Logistyka dnia slubu',
      items: createItems('11', [
        'Zorganizowac transport Pary Mlodej',
        'Ustalic harmonogram dnia slubu',
        'Spakowac rzeczy na dzien slubu',
      ]),
    },
    {
      id: '12',
      title: 'Ostatnie kroki',
      items: createItems('12', [
        'Potwierdzic wszystkie rezerwacje',
        'Odebrac dokumenty i obraczki',
        'Wziac slub',
      ]),
    },
  ]

  return { sections }
}
