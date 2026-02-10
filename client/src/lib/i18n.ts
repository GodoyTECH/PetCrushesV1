import { create } from 'zustand';

type Language = 'pt-BR' | 'en';

type Translations = {
  [key in Language]: {
    nav: {
      home: string;
      match: string;
      donate: string;
      chat: string;
      profile: string;
      mobipet: string;
      login: string;
      logout: string;
    };
    hero: {
      title: string;
      subtitle: string;
      cta: string;
    };
    match: {
      title: string;
      filters: string;
      empty: string;
      species: string;
      objective: string;
      region: string;
      like: string;
      nope: string;
    };
    donate: {
      title: string;
      subtitle: string;
      adopt: string;
    };
    common: {
      loading: string;
      error: string;
      save: string;
      cancel: string;
      delete: string;
      edit: string;
      create: string;
      yes: string;
      no: string;
      sales_warning: string;
    };
    mobipet: {
      title: string;
      subtitle: string;
      desc: string;
      driver_btn: string;
      ride_btn: string;
    };
    forms: {
      add_pet: string;
      name: string;
      species: string;
      breed: string;
      age: string;
      about: string;
      photos: string;
      submit_pet: string;
      gender: string;
    };
  };
};

export const translations: Translations = {
  'en': {
    nav: {
      home: 'Home',
      match: 'Match',
      donate: 'Adopt',
      chat: 'Chat',
      profile: 'My Pets',
      mobipet: 'MobiPet',
      login: 'Login',
      logout: 'Logout',
    },
    hero: {
      title: 'Find True Love for Your Pet',
      subtitle: 'The safest place for breeding, friendship, and adoption.',
      cta: 'Get Started',
    },
    match: {
      title: 'Find a Match',
      filters: 'Filters',
      empty: 'No more pets in this area!',
      species: 'Species',
      objective: 'Objective',
      region: 'Region',
      like: 'Crush!',
      nope: 'Pass',
    },
    donate: {
      title: 'Adoption Center',
      subtitle: 'Give a loving home to a pet in need.',
      adopt: 'Adopt Me',
    },
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      yes: 'Yes',
      no: 'No',
      sales_warning: 'Sales are strictly prohibited! Use this platform for mating or adoption only.',
    },
    mobipet: {
      title: 'MobiPet',
      subtitle: 'Under Development',
      desc: 'An Uber-style service exclusively for pets. Safe, specialized transport coming soon to your city.',
      driver_btn: 'Be a Driver',
      ride_btn: 'Schedule Ride',
    },
    forms: {
      add_pet: 'Add New Pet',
      name: 'Name',
      species: 'Species',
      breed: 'Breed',
      age: 'Age (months)',
      about: 'About',
      photos: 'Photos',
      submit_pet: 'Register Pet',
      gender: 'Gender',
    }
  },
  'pt-BR': {
    nav: {
      home: 'Início',
      match: 'Encontros',
      donate: 'Adotar',
      chat: 'Conversas',
      profile: 'Meus Pets',
      mobipet: 'MobiPet',
      login: 'Entrar',
      logout: 'Sair',
    },
    hero: {
      title: 'Encontre o Amor Verdadeiro para seu Pet',
      subtitle: 'O lugar mais seguro para cruzamento, amizade e adoção.',
      cta: 'Começar Agora',
    },
    match: {
      title: 'Encontre um Par',
      filters: 'Filtros',
      empty: 'Não há mais pets nesta área!',
      species: 'Espécie',
      objective: 'Objetivo',
      region: 'Região',
      like: 'Crush!',
      nope: 'Passar',
    },
    donate: {
      title: 'Centro de Adoção',
      subtitle: 'Dê um lar amoroso para um pet.',
      adopt: 'Me Adote',
    },
    common: {
      loading: 'Carregando...',
      error: 'Algo deu errado',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      create: 'Criar',
      yes: 'Sim',
      no: 'Não',
      sales_warning: 'Vendas são estritamente proibidas! Use esta plataforma apenas para cruzamento ou adoção.',
    },
    mobipet: {
      title: 'MobiPet',
      subtitle: 'Em Desenvolvimento',
      desc: 'Um serviço estilo Uber exclusivo para pets. Transporte seguro e especializado chegando em breve na sua cidade.',
      driver_btn: 'Seja um Motorista',
      ride_btn: 'Agendar Corrida',
    },
    forms: {
      add_pet: 'Adicionar Novo Pet',
      name: 'Nome',
      species: 'Espécie',
      breed: 'Raça',
      age: 'Idade (meses)',
      about: 'Sobre',
      photos: 'Fotos',
      submit_pet: 'Registrar Pet',
      gender: 'Gênero',
    }
  }
};

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations['en'] | Translations['pt-BR'];
}

export const useLanguage = create<LanguageState>((set, get) => ({
  lang: 'pt-BR',
  t: translations['pt-BR'],
  setLang: (lang) => set({ lang, t: translations[lang] }),
}));
