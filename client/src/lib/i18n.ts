import { create } from 'zustand';

type Language = 'pt-BR' | 'en';

export type AppTranslations = {
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
    activePetLabel: string;
    selectActivePet: string;
    needActivePetTitle: string;
    needActivePetDescription: string;
    goToMyPets: string;
    matchedToastTitle: string;
    matchedToastDescription: string;
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
  auth: {
    title: string;
    subtitle: string;
    emailPlaceholder: string;
    codePlaceholder: string;
    signIn: string;
    signUp: string;
    sendCode: string;
    verifyCode: string;
    back: string;
    createAccountHint: string;
    signInHint: string;
    otpSent: string;
    otpSentDev: string;
    codeStepTitle: string;
    codeStepSubtitle: string;
    policiesNote: string;
    errors: {
      invalidCode: string;
      requestFailed: string;
      invalidEmail: string;
      generic: string;
      emailNotRegistered: string;
      emailAlreadyRegistered: string;

    };
  };
  onboarding: {
    title: string;
    subtitle: string;
    profilePhoto: string;
    uploadPhoto: string;
    displayName: string;
    firstName: string;
    lastName: string;
    whatsapp: string;
    whatsappPlaceholder: string;
    country: string;
    state: string;
    city: string;
    save: string;
    saving: string;
    successTitle: string;
    successDescription: string;
    errors: {
      requiredFields: string;
      invalidWhatsapp: string;
      uploadFailed: string;
      saveFailed: string;

    };
  };
};

type Translations = {
  [key in Language]: AppTranslations;
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
      activePetLabel: 'My active pet',
      selectActivePet: 'Choose your active pet',
      needActivePetTitle: 'Choose an active pet to continue',
      needActivePetDescription: 'Select one of your pets to like and start chats.',
      goToMyPets: 'Go to my pets',
      matchedToastTitle: "It's a match!",
      matchedToastDescription: "It's a match! Now you can start chatting.",
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
    },
    auth: {
      title: 'Welcome to PetCrushes',
      subtitle: 'Choose how you want to continue.',
      emailPlaceholder: 'you@email.com',
      codePlaceholder: 'Enter 6-digit code',
      signIn: 'Sign In',
      signUp: 'Create Account',
      sendCode: 'Send code',
      verifyCode: 'Verify code',
      back: 'Back',
      createAccountHint: 'New here? Create account.',
      signInHint: 'Already registered? Sign in.',
      otpSent: 'Code sent to your email.',
      otpSentDev: 'Code sent via dev mode. Check server logs.',
      codeStepTitle: 'Check your email',
      codeStepSubtitle: 'Enter your 6-digit code to continue.',
      policiesNote: 'By continuing, you agree to our no-sales policy.',
      errors: {
        invalidCode: 'Invalid or expired code. Request a new one.',
        requestFailed: 'We could not send the code right now. Please try again shortly.',
        invalidEmail: 'Please check your email and try again.',
        generic: 'Something went wrong. Please try again.',
        emailNotRegistered: 'This email is not registered yet. Click Create Account.',
        emailAlreadyRegistered: 'This email is already registered. Click Sign In.',
      },

    },
    onboarding: {
      title: 'Complete your profile',
      subtitle: 'Add your basic info to continue safely.',
      profilePhoto: 'Profile photo',
      uploadPhoto: 'Upload photo',
      displayName: 'Display name',
      firstName: 'First name (optional)',
      lastName: 'Last name (optional)',
      whatsapp: 'WhatsApp',
      whatsappPlaceholder: '+55 (11) 99999-9999',
      country: 'Country',
      state: 'State',
      city: 'City',
      save: 'Save and continue',
      saving: 'Saving...',
      successTitle: 'Profile updated',
      successDescription: 'Your profile is complete. Welcome!',
      errors: {
        requiredFields: 'Please fill in name, WhatsApp and location.',
        invalidWhatsapp: 'Please enter a valid WhatsApp number.',
        uploadFailed: 'Could not upload the photo now. Try again in a moment.',
        saveFailed: 'Could not save your profile now. Try again shortly.',
      },

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
      activePetLabel: 'Meu pet ativo',
      selectActivePet: 'Escolha seu pet ativo',
      needActivePetTitle: 'Escolha um pet ativo para continuar',
      needActivePetDescription: 'Selecione um dos seus pets para curtir e iniciar conversas.',
      goToMyPets: 'Ir para meus pets',
      matchedToastTitle: 'Deu match!',
      matchedToastDescription: 'Deu match! Agora vocês podem conversar.',
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
    },
    auth: {
      title: 'Bem-vindo ao PetCrushes',
      subtitle: 'Escolha como deseja continuar.',
      emailPlaceholder: 'voce@email.com',
      codePlaceholder: 'Digite o código de 6 dígitos',
      signIn: 'Entrar',
      signUp: 'Criar conta',
      sendCode: 'Enviar código',
      verifyCode: 'Validar código',
      back: 'Voltar',
      createAccountHint: 'Primeiro acesso? Crie sua conta.',
      signInHint: 'Já tem cadastro? Entre.',
      otpSent: 'Código enviado para seu e-mail.',
      otpSentDev: 'Código enviado em modo dev. Verifique os logs do servidor.',
      codeStepTitle: 'Verifique seu e-mail',
      codeStepSubtitle: 'Digite o código de 6 dígitos para continuar.',
      policiesNote: 'Ao continuar, você concorda com nossa política de não vendas.',
      errors: {
        invalidCode: 'Código inválido ou expirado. Peça um novo.',
        requestFailed: 'Não conseguimos enviar o código agora. Tente novamente em alguns instantes.',
        invalidEmail: 'Verifique seu e-mail e tente novamente.',
        generic: 'Algo deu errado. Tente novamente.',
        emailNotRegistered: 'Esse e-mail ainda não está cadastrado. Clique em Criar conta.',
        emailAlreadyRegistered: 'Esse e-mail já está cadastrado. Clique em Entrar.',
      },
    },
    onboarding: {
      title: 'Complete seu perfil',
      subtitle: 'Adicione suas informações básicas para continuar com segurança.',
      profilePhoto: 'Foto de perfil',
      uploadPhoto: 'Enviando foto...',
      displayName: 'Nome público',
      firstName: 'Nome (opcional)',
      lastName: 'Sobrenome (opcional)',
      whatsapp: 'WhatsApp',
      whatsappPlaceholder: '+55 (11) 99999-9999',
      country: 'País',
      state: 'Estado',
      city: 'Cidade',
      save: 'Salvar e continuar',
      saving: 'Salvando...',
      successTitle: 'Perfil atualizado',
      successDescription: 'Seu perfil está completo. Bem-vindo(a)!',
      errors: {
        requiredFields: 'Preencha nome, WhatsApp e localização para continuar.',
        invalidWhatsapp: 'Digite um número de WhatsApp válido.',
        uploadFailed: 'Não foi possível enviar a foto agora. Tente novamente em instantes.',
        saveFailed: 'Não foi possível salvar seu perfil agora. Tente novamente em instantes.',
      },
    }
  }
};

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations['en'] | Translations['pt-BR'];
}

const LANGUAGE_STORAGE_KEY = 'petcrushes_lang';

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'pt-BR' || stored === 'en') return stored;
  return 'pt-BR';
}

const initialLanguage = getInitialLanguage();

export const useLanguage = create<LanguageState>((set) => ({
  lang: initialLanguage,
  t: translations[initialLanguage],
  setLang: (lang) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    set({ lang, t: translations[lang] });
  },
}));
