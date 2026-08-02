import api from './api';

export interface Note {
  _id: string;
  title: string;
  year: string;
  description: string;
  price: number;
  image: string;
  courseId?: {
    _id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NoteOrder {
  _id: string;
  noteId: string;
  userId: string;
  name: string;
  studentPhone: string;
  guardianPhone: string;
  address: string;
  paymentMethod: 'cash';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  orderedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Get all notes
export const getNotes = async (): Promise<Note[]> => {
  try {
    const response = await api.get('/notes');
    return response.data.data;
  } catch (error) {
    // Fallback to mock data if API is not available
    console.warn('API not available, using mock data');
    return [
      {
        _id: 'n1',
        title: 'مذكرة الفيزياء - الشهر الأول',
        year: 'ثالثة ثانوي',
        description: 'مذكرة شاملة لمنهج الشهر الأول مع أمثلة محلولة',
        price: 50,
        image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'n2',
        title: 'مذكرة الرياضيات - التفاضل',
        year: 'ثالثة ثانوي',
        description: 'مذكرة متخصصة في التفاضل مع تمارين متنوعة',
        price: 45,
        image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'n3',
        title: 'مذكرة الكيمياء العضوية',
        year: 'ثالثة ثانوي',
        description: 'شرح مبسط للكيمياء العضوية مع رسومات توضيحية',
        price: 40,
        image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
};

// Get user-specific notes
export const getUserNotes = async (): Promise<Note[]> => {
  try {
    const response = await api.get('/notes/user');
    return response.data.data;
  } catch (error) {
    // Fallback to mock data if API is not available
    console.warn('API not available, using mock data');
    return [
      {
        _id: 'n1',
        title: 'مذكرة الفيزياء - الشهر الأول',
        year: 'ثالثة ثانوي',
        description: 'مذكرة شاملة لمنهج الشهر الأول مع أمثلة محلولة',
        price: 50,
        image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'n2',
        title: 'مذكرة الرياضيات - التفاضل',
        year: 'ثالثة ثانوي',
        description: 'مذكرة متخصصة في التفاضل مع تمارين متنوعة',
        price: 45,
        image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
};

// Get note by ID
export const getNoteById = async (id: string): Promise<Note> => {
  try {
    const response = await api.get(`/notes/${id}`);
    return response.data.data.note;
  } catch (error) {
    // Fallback to mock data if API is not available
    console.warn('API not available, using mock data');
    return {
      _id: id,
      title: 'مذكرة الفيزياء - الشهر الأول',
      year: 'ثالثة ثانوي',
      description: 'مذكرة شاملة لمنهج الشهر الأول مع أمثلة محلولة',
      price: 50,
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
};

// Create note order
export const createNoteOrder = async (orderData: Omit<NoteOrder, '_id' | 'createdAt' | 'updatedAt'>): Promise<NoteOrder> => {
  try {
    const response = await api.post('/notes/orders', orderData);
    return response.data.data.order;
  } catch (error) {
    // Fallback to localStorage if API is not available
    console.warn('API not available, using localStorage');
    const orders = JSON.parse(localStorage.getItem('electron_note_orders') || '[]');
    const newOrder = {
      _id: `order_${Date.now()}`,
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    localStorage.setItem('electron_note_orders', JSON.stringify(orders));
    return newOrder;
  }
};

// Get user's note orders
export const getNoteOrders = async (userId: string): Promise<NoteOrder[]> => {
  try {
    const response = await api.get(`/notes/orders?userId=${userId}`);
    return response.data.data;
  } catch (error) {
    // Fallback to localStorage if API is not available
    console.warn('API not available, using localStorage');
    return JSON.parse(localStorage.getItem('electron_note_orders') || '[]');
  }
};