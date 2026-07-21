export interface MenuItem {
  name: string;
  price: number;
  category: 'appetizer' | 'main' | 'dessert' | 'drink';
  description?: string;
}

export interface Market {
  id: number;
  name: string;
  description: string;
  address: string;
  location: string;
  category: string;
  openingHours: string;
  closingHours?: string;
  totalBooth: number;
  activeBooth: number;
  occupancy: number;
  mapWidth?: number;
  mapHeight?: number;
  thumbnailUrl?: string;
  image?: string;
  lat?: number;
  lng?: number;
  status: 'Active' | 'Inactive' | 'Maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface Booth {
  id: number;
  name: string;
  boothCode: string;
  marketId: number;
  market: string;
  owner: string;
  ownerId: number;
  phone: string;
  location: string;
  zone: string;
  slotNumber: number;
  category: string;
  plan: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending' | 'Approved' | 'Rejected' | 'Closed';
  revenue: string;
  paymentQRImage?: string;
  registered: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
  documents?: {
    businessLicense?: { name: string; verified: boolean; uploadedAt: string };
    foodSafety?: { name: string; verified: boolean; uploadedAt: string };
    healthPermit?: { name: string; verified: boolean; uploadedAt: string };
    insurance?: { name: string; verified: boolean; uploadedAt: string };
  };
  images?: string[];
  description?: string;
  menu?: MenuItem[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'customer' | 'booth_owner' | 'admin';
  registered: string;
  status: 'Active' | 'Suspended';
  boothsOwned?: number[];
  totalOrders?: number;
  totalSpent?: string;
  lastActive?: string;
}

export interface Complaint {
  id: string;
  userId: number;
  boothId: number;
  marketId: number;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
  created: string;
  description: string;
  images: number;
  conversations: {
    senderId: number;
    senderName: string;
    senderType: 'customer' | 'admin' | 'booth_owner';
    message: string;
    time: string;
  }[];
}

export const markets: Market[] = [
  {
    id: 1,
    name: 'Ben Thanh Night Market',
    description: 'The busiest night market in central Ho Chi Minh City with hundreds of unique street food stalls.',
    address: '1 Le Loi, Ben Thanh Ward, District 1, Ho Chi Minh City',
    location: 'District 1, Ho Chi Minh City',
    category: 'Street Food Market',
    openingHours: '18:00',
    closingHours: '24:00',
    totalBooth: 5,
    activeBooth: 3,
    occupancy: 60.0,
    mapWidth: 100,
    mapHeight: 120,
    thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    lat: 10.7721,
    lng: 106.6980,
    status: 'Active',
    createdAt: '2022-01-15',
    updatedAt: '2024-05-20',
  },
  {
    id: 2,
    name: 'Phu Quoc Night Market',
    description: 'A paradise of fresh seafood and marine specialties of Phu Quoc Pearl Island.',
    address: '118 Tran Hung Dao, Duong Dong, Phu Quoc, Kien Giang',
    location: 'Phu Quoc, Kien Giang',
    category: 'Seafood Market',
    openingHours: '17:00',
    closingHours: '23:00',
    totalBooth: 5,
    activeBooth: 3,
    occupancy: 60.0,
    mapWidth: 80,
    mapHeight: 100,
    thumbnailUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    lat: 10.2295,
    lng: 103.9708,
    status: 'Active',
    createdAt: '2022-03-10',
    updatedAt: '2024-04-15',
  },
  {
    id: 3,
    name: 'Da Lat Night Market',
    description: 'Famous night market with mountain specialties, fresh vegetables and typical cold atmosphere.',
    address: '3 Nguyen Thi Minh Khai, Ward 1, Da Lat, Lam Dong',
    location: 'Da Lat, Lam Dong',
    category: 'Mountain Specialty Market',
    openingHours: '17:00',
    closingHours: '23:00',
    totalBooth: 5,
    activeBooth: 3,
    occupancy: 60.0,
    mapWidth: 90,
    mapHeight: 110,
    thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    lat: 11.9404,
    lng: 108.4583,
    status: 'Active',
    createdAt: '2022-06-01',
    updatedAt: '2024-05-01',
  },
  {
    id: 4,
    name: 'Hoi An Night Market',
    description: 'Night market imbued with the cultural identity of the ancient town with traditional Hoi An cuisine.',
    address: '24 Tran Phu, Minh An Ward, Hoi An, Quang Nam',
    location: 'Hoi An, Quang Nam',
    category: 'Traditional Food Market',
    openingHours: '18:00',
    closingHours: '22:30',
    totalBooth: 5,
    activeBooth: 3,
    occupancy: 60.0,
    mapWidth: 60,
    mapHeight: 80,
    thumbnailUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    lat: 15.8801,
    lng: 108.3380,
    status: 'Active',
    createdAt: '2022-09-15',
    updatedAt: '2024-03-20',
  },
];

const categories = ['Fast Food', 'Beverages', 'Seafood', 'Traditional Food', 'Pastries', 'Fruits', 'Grilled Dishes', 'Vegetarian'];
const plans = ['Basic', 'Premium', 'Featured'];
const zones = ['A', 'B', 'C', 'D', 'E'];

const boothNames = [
  'Saigon Banh Mi', 'Vietnamese Iced Coffee', 'Fruit Smoothies',
  'Hanoi Bun Cha', 'Traditional Beef Pho', 'Broken Rice with Pork',
  'Nam Vang Noodle Soup', 'Western Vietnamese Crepe', 'Nha Trang Grilled Pork',
  'Three Color Dessert', 'Fresh Spring Rolls', 'Shaking Beef',
  'Bubble Tea', 'Grilled Seafood', 'Nutritious Vegetarian Rice',
  'Thai Seafood Hotpot', 'Hue Beef Noodle Soup', 'Spicy Grilled Squid',
  'Crispy Spring Rolls', 'Crab Noodle Soup', 'Hoi An Cao Lau',
  'Pad Thai Station', 'Som Tam Corner', 'MaKo Sticky Rice',
  'Thai Grilled Seafood', 'Tom Yum Noodles', 'Satay Grill',
  'Coconut Ice Cream', 'Thai Milk Tea', 'Spring Rolls Heaven',
];

const ownerNames = [
  'Nguyen Van An', 'Tran Thi Binh', 'Le Hoang Cuong', 'Pham Thu Dung', 'Vo Minh Duc',
  'Hoang Thi Em', 'Do Van Phong', 'Bui Thi Giang', 'Phan Quoc Huy', 'Mai Thi Hoa',
  'Dinh Van Khoa', 'Ly Thi Lan', 'Vu Minh Long', 'Dang Thu Nga', 'To Van Nam',
  'Trinh Thi Oanh', 'Duong Van Phu', 'Cao Thi Quynh', 'Ngo Van Son', 'Save Thi Tam',
];

const phoneNumbers = [
  '+84 901 234 567', '+84 912 345 678', '+84 923 456 789', '+84 934 567 890', '+84 945 678 901',
  '+84 956 789 012', '+84 967 890 123', '+84 978 901 234', '+84 989 012 345', '+84 990 123 456',
  '+84 901 234 568', '+84 912 345 679', '+84 923 456 780', '+84 934 567 891', '+84 945 678 902',
  '+84 956 789 013', '+84 967 890 124', '+84 978 901 235', '+84 989 012 346', '+84 990 123 457',
];

const categoryBoothImages: Record<string, string[]> = {
  'Fast Food': [
    'https://images.unsplash.com/photo-1552912470-ee2e96439539?w=600',
    'https://images.unsplash.com/photo-1535898331935-2d274aff0fbc?w=600',
    'https://images.unsplash.com/photo-1514327567052-1eed4e4902c1?w=600',
    'https://images.unsplash.com/photo-1687902409602-8b7cf039a44a?w=600',
  ],
  'Beverages': [
    'https://images.unsplash.com/photo-1741243038487-1d835e67bcbf?w=600',
    'https://images.unsplash.com/photo-1671659420749-d56efede6df4?w=600',
    'https://images.unsplash.com/photo-1600340432752-a407bab94cc3?w=600',
    'https://images.unsplash.com/photo-1747016804753-866c3ed6b3b7?w=600',
  ],
  'Seafood': [
    'https://images.unsplash.com/photo-1758346971766-abbcfe706e1d?w=600',
    'https://images.unsplash.com/photo-1758184665571-6c64f6d19db6?w=600',
    'https://images.unsplash.com/photo-1768162126031-063c44c9a213?w=600',
    'https://images.unsplash.com/photo-1778327564817-410003989323?w=600',
  ],
  'Traditional Food': [
    'https://images.unsplash.com/photo-1626509653291-5558b258f107?w=600',
    'https://images.unsplash.com/photo-1554054204-b2f70b09d031?w=600',
    'https://images.unsplash.com/photo-1598977700511-fe0707d5eae6?w=600',
    'https://images.unsplash.com/photo-1552912470-ee2e96439539?w=600',
  ],
  'Pastries': [
    'https://images.unsplash.com/photo-1773534962522-71d9dab3d79b?w=600',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600',
  ],
  'Fruits': [
    'https://images.unsplash.com/photo-1628870773515-121c2b0c584f?w=600',
    'https://images.unsplash.com/photo-1560761098-21f5722ecb14?w=600',
    'https://images.unsplash.com/photo-1609780447631-05b93e5a88ea?w=600',
    'https://images.unsplash.com/photo-1585590853943-67022b1d8fe8?w=600',
  ],
  'Grilled Dishes': [
    'https://images.unsplash.com/photo-1779782357612-fc8238112f83?w=600',
    'https://images.unsplash.com/photo-1778327564625-abda522078de?w=600',
    'https://images.unsplash.com/photo-1771868456622-496aeeb48b2c?w=600',
    'https://images.unsplash.com/photo-1763621491199-a7e7d33bf7ac?w=600',
  ],
  'Vegetarian': [
    'https://images.unsplash.com/photo-1759659136517-70b89d76601f?w=600',
    'https://images.unsplash.com/photo-1770359646967-1d008a71e42e?w=600',
    'https://images.unsplash.com/photo-1768130124296-32c225fca8d1?w=600',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
  ],
};

const defaultBoothImages = [
  'https://images.unsplash.com/photo-1552912470-ee2e96439539?w=600',
  'https://images.unsplash.com/photo-1535898331935-2d274aff0fbc?w=600',
  'https://images.unsplash.com/photo-1514327567052-1eed4e4902c1?w=600',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
];

const menuByCategory: Record<string, MenuItem[]> = {
  'Fast Food': [
    { name: 'Special Meat Banh Mi', price: 25000, category: 'appetizer' },
    { name: 'Pate Banh Mi', price: 20000, category: 'appetizer' },
    { name: 'Beef Hamburger', price: 45000, category: 'main' },
    { name: 'Hot Dog', price: 30000, category: 'main' },
    { name: 'French Fries', price: 25000, category: 'appetizer' },
    { name: 'Soft Drinks', price: 15000, category: 'drink' },
  ],
  'Beverages': [
    { name: 'Vietnamese Iced Coffee', price: 20000, category: 'drink' },
    { name: 'Black Coffee', price: 18000, category: 'drink' },
    { name: 'Bubble Tea', price: 35000, category: 'drink' },
    { name: 'Avocado Smoothie', price: 30000, category: 'drink' },
    { name: 'Sugarcane Juice', price: 15000, category: 'drink' },
    { name: 'Peach Tea', price: 25000, category: 'drink' },
  ],
  'Seafood': [
    { name: 'Grilled Oysters with Scallions', price: 80000, category: 'appetizer' },
    { name: 'Spicy Grilled Squid', price: 120000, category: 'main' },
    { name: 'Chili Salt Grilled Shrimp', price: 150000, category: 'main' },
    { name: 'Salt Roasted Crab', price: 180000, category: 'main' },
    { name: 'Seafood Salad', price: 90000, category: 'appetizer' },
    { name: 'Saigon Beer', price: 20000, category: 'drink' },
  ],
  'Traditional Food': [
    { name: 'Spring Rolls', price: 30000, category: 'appetizer' },
    { name: 'Rare Beef Pho', price: 70000, category: 'main' },
    { name: 'Bun Cha', price: 60000, category: 'main' },
    { name: 'Pork Chop Broken Rice', price: 50000, category: 'main' },
    { name: 'Hue Beef Noodle Soup', price: 65000, category: 'main' },
    { name: 'Three Color Dessert', price: 25000, category: 'dessert' },
  ],
  'Pastries': [
    { name: 'Flan Cake', price: 20000, category: 'dessert' },
    { name: 'Tiramisu Cake', price: 45000, category: 'dessert' },
    { name: 'Strawberry Cream Cake', price: 50000, category: 'dessert' },
    { name: 'Macaron', price: 15000, category: 'dessert' },
    { name: 'Croissant', price: 25000, category: 'appetizer' },
    { name: 'Orange Juice', price: 25000, category: 'drink' },
  ],
  'Fruits': [
    { name: 'Fresh Fruit Plate', price: 40000, category: 'dessert' },
    { name: 'Strawberry Smoothie', price: 30000, category: 'drink' },
    { name: 'Avocado Smoothie', price: 35000, category: 'drink' },
    { name: 'Watermelon Juice', price: 25000, category: 'drink' },
    { name: 'Shaken Mango', price: 30000, category: 'dessert' },
    { name: 'Fresh Coconut', price: 20000, category: 'drink' },
  ],
  'Grilled Dishes': [
    { name: 'Grilled Skewers', price: 15000, category: 'appetizer' },
    { name: 'Grilled Beef in Lolot Leaves', price: 120000, category: 'main' },
    { name: 'BBQ Pork Ribs', price: 150000, category: 'main' },
    { name: 'Honey Grilled Chicken', price: 130000, category: 'main' },
    { name: 'Grilled Snakehead Fish', price: 180000, category: 'main' },
    { name: 'Beer/Soft Drink', price: 15000, category: 'drink' },
  ],
  'Vegetarian': [
    { name: 'Vegetarian Spring Rolls', price: 25000, category: 'appetizer' },
    { name: 'Special Vegetarian Rice', price: 45000, category: 'main' },
    { name: 'Vegetarian Pho', price: 50000, category: 'main' },
    { name: 'Vegetarian Crab Noodle Soup', price: 45000, category: 'main' },
    { name: 'Vegetable Salad', price: 35000, category: 'appetizer' },
    { name: 'Passion Fruit Juice', price: 20000, category: 'drink' },
  ],
};

const generateMenu = (category: string): MenuItem[] => {
  const baseMenu = menuByCategory[category] || menuByCategory['Fast Food'];
  return baseMenu.map(item => ({
    ...item,
    price: item.price + Math.floor((Math.random() * 10000 - 5000) / 1000) * 1000,
  }));
};

let _boothIdCounter = 1;

export const booths: Booth[] = (() => {
  const allBooth: Booth[] = [];
  _boothIdCounter = 1;

  markets.forEach((market, marketIndex) => {
    const makeBoothCode = (id: number) => `BT-${String(id).padStart(4, '0')}`;

    const pushBooth = (i: number, status: 'Active' | 'Inactive' | 'Suspended' | 'Pending' | 'Approved' | 'Rejected' | 'Closed', datePrefix: string) => {
      const id = _boothIdCounter++;
      const zone = zones[i % zones.length];
      const slotNumber = Math.floor(i / zones.length) + 1;
      const boothCategory = categories[(marketIndex * 5 + i) % categories.length];
      const boothName = boothNames[(marketIndex * 5 + i) % boothNames.length];
      const ownerIndex = marketIndex * 5 + i;
      const registeredDate = `${datePrefix}-${String((i % 28) + 1).padStart(2, '0')}`;
      const noRevenue = status === 'Pending' || status === 'Rejected' || status === 'Closed';
      const revenue = noRevenue
        ? '0 VND'
        : `${(Math.random() * 250000000 + 50000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} VND`;

      const verifyRandom = (threshold: number) => Math.random() > threshold;
      const catImages = categoryBoothImages[boothCategory] || defaultBoothImages;

      allBooth.push({
        id,
        name: boothName,
        boothCode: makeBoothCode(id),
        marketId: market.id,
        market: market.name,
        owner: ownerNames[ownerIndex],
        ownerId: ownerIndex + 1,
        phone: phoneNumbers[ownerIndex % phoneNumbers.length],
        location: `Zone ${zone}, Slot ${slotNumber}`,
        zone,
        slotNumber,
        category: boothCategory,
        plan: plans[i % plans.length],
        status,
        revenue,
        paymentQRImage: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BOOTH-${id}`,
        registered: registeredDate,
        createdAt: registeredDate,
        updatedAt: '2024-06-01',
        image: catImages[i % catImages.length],
        description: `${boothCategory} booth offering authentic and delicious ${boothCategory.toLowerCase()}. We prioritize quality ingredients and customer satisfaction.`,
        menu: generateMenu(boothCategory),
        documents: {
          businessLicense: {
            name: 'Business_License.png',
            verified: status === 'Active' ? true : verifyRandom(0.3),
            uploadedAt: registeredDate,
          },
          foodSafety: {
            name: 'Food_Safety_Certificate.png',
            verified: status === 'Active' ? true : verifyRandom(0.4),
            uploadedAt: registeredDate,
          },
          healthPermit: {
            name: 'Health_Permit.png',
            verified: status === 'Active' ? true : verifyRandom(0.5),
            uploadedAt: registeredDate,
          },
          insurance: verifyRandom(status === 'Active' ? 0.3 : 0.5) ? {
            name: 'Liability_Insurance.png',
            verified: verifyRandom(0.2),
            uploadedAt: registeredDate,
          } : undefined,
        },
        images: Array.from({ length: 3 }, (_, idx) =>
          catImages[(i + idx) % catImages.length]
        ),
      });
    };

    let idx = 0;
    pushBooth(idx++, 'Active', `2024-0${(marketIndex % 9) + 1}`);
    pushBooth(idx++, 'Active', `2024-0${((marketIndex + 1) % 9) + 1}`);
    pushBooth(idx++, 'Active', `2024-0${((marketIndex + 2) % 9) + 1}`);
    pushBooth(idx++, 'Suspended', `2023-08`);
    pushBooth(idx++, 'Pending', `2024-06`);
  });

  return allBooth;
})();

export const getMarketStats = () => {
  const totalBooth = booths.length;
  const activeBooth = booths.filter(b => b.status === 'Active').length;
  const suspendedBooth = booths.filter(b => b.status === 'Suspended').length;
  const pendingBooth = booths.filter(b => b.status === 'Pending').length;
  return { totalBooth, activeBooth, suspendedBooth, pendingBooth };
};

export const getSubscriptionStats = () => {
  const basicBooth = booths.filter(b => b.plan === 'Basic' && b.status === 'Active').length;
  const premiumBooth = booths.filter(b => b.plan === 'Premium' && b.status === 'Active').length;
  const featuredBooth = booths.filter(b => b.plan === 'Featured' && b.status === 'Active').length;
  return { basicBooth, premiumBooth, featuredBooth };
};

export interface Subscription {
  id: number;
  boothId: number;
  booth: string;
  plan: string;
  start: string;
  end: string;
  status: string;
  owner: string;
  market: string;
}

export const subscriptions: Subscription[] = booths
  .filter(b => b.status === 'Active')
  .slice(0, 50)
  .map((booth, index) => {
    const startDate = new Date(booth.registered);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 6);
    const today = new Date('2024-06-01');
    const daysUntilExpiry = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const status = daysUntilExpiry < 14 ? 'Expiring Soon' : 'Active';
    return {
      id: index + 1,
      boothId: booth.id,
      booth: booth.name,
      plan: booth.plan,
      start: booth.registered,
      end: endDate.toISOString().split('T')[0],
      status,
      owner: booth.owner,
      market: booth.market,
    };
  });

const customerNames = [
  'Alice Johnson', 'Bob Smith', 'Carol White', 'David Lee', 'Emma Brown',
  'Frank Wilson', 'Grace Chen', 'Henry Davis', 'Iris Martinez', 'Jack Taylor',
  'Karen Anderson', 'Leo Thompson', 'Mia Jackson', 'Noah Harris', 'Olivia Clark',
  'Peter Lewis', 'Quinn Robinson', 'Rachel Walker', 'Sam Hall', 'Tina YouK',
];

export const users: User[] = [
  ...ownerNames.map((name, index) => ({
    id: index + 1,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: phoneNumbers[index % phoneNumbers.length],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    role: 'booth_owner' as const,
    registered: `2023-${String(Math.floor((index * 7) % 12) + 1).padStart(2, '0')}-${String((index * 3 % 28) + 1).padStart(2, '0')}`,
    status: index === 2 ? 'Suspended' as const : 'Active' as const,
    boothsOwned: booths.filter(b => b.ownerId === index + 1).map(b => b.id),
    lastActive: '2024-06-01',
    totalOrders: 0,
    totalSpent: '0VND',
  })),
  ...customerNames.map((name, index) => ({
    id: 100 + index,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: `+84${900000000 + index * 1234567}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    role: 'customer' as const,
    registered: `2024-0${(index % 9) + 1}-${String((index * 3 % 28) + 1).padStart(2, '0')}`,
    status: 'Active' as const,
    totalOrders: Math.floor(Math.random() * 80) + 5,
    totalSpent: `${(Math.random() * 30000000 + 2000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}VND`,
    lastActive: `2024-06-0${(index % 9) + 1}`,
  })),
];

export const complaints: Complaint[] = [
  {
    id: 'CMP-001',
    userId: 100,
    boothId: 1,
    marketId: 1,
    category: 'Food Quality',
    priority: 'High',
    status: 'Open',
    created: '2024-06-01 14:30',
    description: 'The food I ordered was served cold and did not match the description on the menu.',
    images: 2,
    conversations: [
      { senderId: 100, senderName: 'Alice Johnson', senderType: 'customer', message: 'The food was cold and not as described', time: '14:30' },
      { senderId: 0, senderName: 'Admin', senderType: 'admin', message: 'Thank you for reporting. We are investigatiK.', time: '14:45' },
    ],
  },
  {
    id: 'CMP-002',
    userId: 101,
    boothId: 2,
    marketId: 1,
    category: 'Pricing',
    priority: 'Medium',
    status: 'Investigating',
    created: '2024-06-01 12:15',
    description: 'I was charged a different price than listed. The sign said 300,000 VND but I was charged 400,000 VND.',
    images: 1,
    conversations: [
      { senderId: 101, senderName: 'Bob Smith', senderType: 'customer', message: 'Charged 400,000 VND instead of 300,000 VND', time: '12:15' },
      { senderId: 0, senderName: 'Admin', senderType: 'admin', message: 'We have contacted the booth owner.', time: '12:30' },
      { senderId: 2, senderName: 'Tran Thi Binh', senderType: 'booth_owner', message: 'The price was updated yesterday.', time: '13:00' },
    ],
  },
  {
    id: 'CMP-003',
    userId: 102,
    boothId: 3,
    marketId: 1,
    category: 'Service',
    priority: 'Critical',
    status: 'Open',
    created: '2024-06-01 10:45',
    description: 'The staff was exMemely rude and unprofessional.',
    images: 0,
    conversations: [
      { senderId: 102, senderName: 'Carol White', senderType: 'customer', message: 'Very rude staff, unacceptable behavior', time: '10:45' },
    ],
  },
  {
    id: 'CMP-004',
    userId: 100,
    boothId: 15,
    marketId: 1,
    category: 'Hygiene',
    priority: 'Critical',
    status: 'Investigating',
    created: '2024-06-01 09:20',
    description: 'Found cockroaches in the food preparation area.',
    images: 3,
    conversations: [
      { senderId: 100, senderName: 'Alice Johnson', senderType: 'customer', message: 'I saw cockroaches crawling in the kitchen!', time: '09:20' },
      { senderId: 0, senderName: 'Admin', senderType: 'admin', message: 'We will check immediately.', time: '09:35' },
    ],
  },
  {
    id: 'CMP-005',
    userId: 103,
    boothId: 8,
    marketId: 2,
    category: 'Food Quality',
    priority: 'High',
    status: 'Open',
    created: '2024-06-02 16:10',
    description: 'Seafood was not fresh, caused stomach issues.',
    images: 1,
    conversations: [
      { senderId: 103, senderName: 'David Lee', senderType: 'customer', message: 'Got food poisoning from the shrimp dish', time: '16:10' },
    ],
  },
  {
    id: 'CMP-006',
    userId: 104,
    boothId: 12,
    marketId: 3,
    category: 'Service',
    priority: 'Low',
    status: 'Resolved',
    created: '2024-05-28 20:00',
    description: 'LoK waiting time for orders.',
    images: 0,
    conversations: [
      { senderId: 104, senderName: 'Emma Brown', senderType: 'customer', message: 'Waited 45 minutes for 2 items', time: '20:00' },
      { senderId: 0, senderName: 'Admin', senderType: 'admin', message: 'Booth owner has been notified.', time: '20:30' },
    ],
  },
];

export const getUserById = (id: number): User | undefined => users.find(u => u.id === id);
export const getBoothById = (id: number): Booth | undefined => booths.find(b => b.id === id);
export const getMarketById = (id: number): Market | undefined => markets.find(m => m.id === id);
export const getPendingBooth = () => booths.filter(b => b.status === 'Pending');
export const getRequestBooth = () => booths.filter(b => b.status === 'Pending' || b.status === 'Approved' || b.status === 'Rejected');
export const getOpenComplaints = () => complaints.filter(c => c.status === 'Open' || c.status === 'Investigating');

// Reviews

export interface Review {
  id: string;
  customerId: number;
  customerName: string;
  boothId: number;
  orderId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export const reviews: Review[] = [
  { id: 'RV-001', customerId: 100, customerName: 'Alice Johnson', boothId: 1, orderId: 'ORD-1001', rating: 5, comment: 'Excellent food. The banh mi was fresh and delicious. Will definitely come back.', createdAt: '2024-06-01 20:30', updatedAt: '2024-06-01 20:30' },
  { id: 'RV-002', customerId: 101, customerName: 'Bob Smith', boothId: 3, orderId: 'ORD-1002', rating: 4, comment: 'Very good pho. The broth was rich and flavorful. A little slow but worth the wait.', createdAt: '2024-06-01 19:45', updatedAt: '2024-06-01 19:45' },
  { id: 'RV-003', customerId: 102, customerName: 'Carol White', boothId: 7, orderId: 'ORD-1003', rating: 2, comment: 'Disappointing. The food was cold and not as described on the menu. Service was also unfriendly.', createdAt: '2024-06-01 18:20', updatedAt: '2024-06-01 18:20' },
  { id: 'RV-004', customerId: 103, customerName: 'David Lee', boothId: 5, orderId: 'ORD-1004', rating: 5, comment: 'Amazing seafood! Freshest prawns I have ever had at a night market.', createdAt: '2024-06-02 21:15', updatedAt: '2024-06-02 21:15' },
  { id: 'RV-005', customerId: 104, customerName: 'Emma Brown', boothId: 12, orderId: 'ORD-1005', rating: 3, comment: 'Average experience. Food was okay but prices are a bit high compared to other stalls.', createdAt: '2024-06-02 20:00', updatedAt: '2024-06-02 20:00' },
  { id: 'RV-006', customerId: 105, customerName: 'Frank Wilson', boothId: 2, orderId: 'ORD-1006', rating: 1, comment: 'Terrible! Found a hair in my food. Very unhygienic. Will never return.', createdAt: '2024-06-02 19:30', updatedAt: '2024-06-02 19:30' },
  { id: 'RV-007', customerId: 106, customerName: 'Grace Chen', boothId: 8, orderId: 'ORD-1007', rating: 5, comment: 'Best iced coffee in the city. The owner is very friendly and the coffee is perfectly brewed.', createdAt: '2024-06-03 10:00', updatedAt: '2024-06-03 10:00' },
  { id: 'RV-008', customerId: 107, customerName: 'Henry Davis', boothId: 15, orderId: 'ORD-1008', rating: 4, comment: 'Great vegetarian options. The chay dishes were nutritious and tasty.', createdAt: '2024-06-03 12:30', updatedAt: '2024-06-03 12:30' },
  { id: 'RV-009', customerId: 108, customerName: 'Iris Martinez', boothId: 20, orderId: 'ORD-1009', rating: 3, comment: 'Decent food, nothing spectacular. The stall was a bit messy.', createdAt: '2024-06-03 19:00', updatedAt: '2024-06-03 19:00' },
  { id: 'RV-010', customerId: 109, customerName: 'Jack Taylor', boothId: 4, orderId: 'ORD-1010', rating: 5, comment: 'Outstanding. The grilled pork noodles were authentic and prepared fresh. Very generous portions.', createdAt: '2024-06-04 20:45', updatedAt: '2024-06-04 20:45' },
  { id: 'RV-011', customerId: 110, customerName: 'Karen Anderson', boothId: 9, orderId: 'ORD-1011', rating: 2, comment: 'Overpriced for what you get. The portion was small and the taste was mediocre.', createdAt: '2024-06-04 18:15', updatedAt: '2024-06-04 18:15' },
  { id: 'RV-012', customerId: 111, customerName: 'Leo Thompson', boothId: 6, orderId: 'ORD-1012', rating: 4, comment: 'Good grilled pork rolls, nicely grilled with great dipping sauce. Would recommend.', createdAt: '2024-06-05 21:00', updatedAt: '2024-06-05 21:00' },
];

// Subscription Packages

export interface SubscriptionPackage {
  id: number;
  packageName: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  promoPrice?: number;
  promoStartDate?: string;
  promoEndDate?: string;
}

export const subscriptionPackages: SubscriptionPackage[] = [
  {
    id: 1,
    packageName: 'Basic',
    price: 600000,
    durationDays: 30,
    description: 'Entry-level plan for new booths and individual vendors just getting started.',
    features: [
      'Standard booth listing on the app',
      'Basic analytics (views)',
      'Email support during business hours',
      'Standard position in listings',
      'Up to 10 menu items',
    ],
    status: 'Active',
    createdAt: '2022-01-01',
    updatedAt: '2024-01-15',
  },
  {
    id: 2,
    packageName: 'Premium',
    price: 1600000,
    durationDays: 30,
    description: 'Advanced plan for booths looking to increase visibility and reach more customers.',
    features: [
      'All Basic features',
      'Priority placement in search results',
      'Advanced analytics (revenue, customers)',
      'Priority chat support',
      'Unlimited menu items',
      '"Premium" badge on booth profile',
    ],
    status: 'Active',
    createdAt: '2022-01-01',
    updatedAt: '2024-01-15',
  },
  {
    id: 3,
    packageName: 'Featured',
    price: 3000000,
    durationDays: 30,
    description: 'Top-tier plan for booths seekiK maximum exposure and strong brand presence on the platform.',
    features: [
      'All Premium features',
      'Homepage featured placement',
      'Full analytics suite + custom reports',
      '24/7 premium support',
      'Full brand conMol',
      'In-app advertising banner',
      'Top priority in all searches',
    ],
    status: 'Active',
    createdAt: '2022-01-01',
    updatedAt: '2024-01-15',
  },
];

// Booth Subscriptions

export interface BoothSubscription {
  id: number;
  boothId: number;
  boothName: string;
  boothOwner: string;
  marketName: string;
  packageId: number;
  packageName: string;
  startDate: string;
  endDate: string;
  price: number;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export const boothSubscription: BoothSubscription[] = booths
  .filter(b => b.status === 'Active')
  .slice(0, 60)
  .map((booth, index) => {
    const pkgId = ((index % 3) + 1) as 1 | 2 | 3;
    const pkg = subscriptionPackages[pkgId - 1];
    const start = new Date(booth.registered);
    const end = new Date(start);
    end.setDate(end.getDate() + pkg.durationDays);
    const today = new Date('2024-06-01');
    const daysLeft = Math.floor((end.getTime() - today.getTime()) / 86400000);
    const status: BoothSubscription['status'] =
      daysLeft < 0 ? 'Expired' :
      daysLeft < 14 ? 'Expiring Soon' : 'Active';
    return {
      id: index + 1,
      boothId: booth.id,
      boothName: booth.name,
      boothOwner: booth.owner,
      marketName: booth.market,
      packageId: pkgId,
      packageName: pkg.packageName,
      startDate: booth.registered,
      endDate: end.toISOString().split('T')[0],
      price: pkg.price,
      status,
      createdAt: booth.registered,
      updatedAt: '2024-06-01',
    };
  });

// Promotional Packages

export interface PromotionalPackage {
  id: number;
  packageName: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export const promotionalPackages: PromotionalPackage[] = [
  {
    id: 1,
    packageName: '7-Day Spotlight',
    price: 350000,
    durationDays: 7,
    description: 'Feature your booth in a prominent position for 7 days to drive Maffic.',
    features: [
      'Top placement within category',
      '"On Promotion" banner display',
      'Push notification to 500 nearest customers',
    ],
    status: 'Active',
    createdAt: '2023-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    packageName: 'Holiday Campaign',
    price: 800000,
    durationDays: 3,
    description: 'Special advertising package designed for holidays and peak seasonal events.',
    features: [
      'Homepage featured banner for 3 days',
      'Push notification to all users',
      'Splash screen display',
    ],
    status: 'Active',
    createdAt: '2023-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 3,
    packageName: 'Monthly Boost',
    price: 1200000,
    durationDays: 30,
    description: 'Sustained visibility boost for your booth throughout an entire month.',
    features: [
      'Top position in search results',
      '"Hot" badge on booth profile',
      'Detailed reach analytics',
      'Weekly push notifications (4 times)',
    ],
    status: 'Active',
    createdAt: '2023-06-01',
    updatedAt: '2024-03-01',
  },
];

export interface BoothPromotionalPackage {
  id: number;
  boothId: number;
  boothName: string;
  boothOwner: string;
  promotionalPackageId: number;
  packageName: string;
  startDate: string;
  endDate: string;
  price: number;
  status: 'Active' | 'Expired' | 'Scheduled';
  createdAt: string;
  updatedAt: string;
}

export const boothPromotionalPackages: BoothPromotionalPackage[] = [
  { id: 1, boothId: 1, boothName: 'Saigon Banh Mi', boothOwner: 'Nguyen Van An', promotionalPackageId: 1, packageName: '7-Day Spotlight', startDate: '2024-06-01', endDate: '2024-06-07', price: 350000, status: 'Active', createdAt: '2024-06-01', updatedAt: '2024-06-01' },
  { id: 2, boothId: 3, boothName: 'Traditional Beef Pho', boothOwner: 'Le Hoang Cuong', promotionalPackageId: 3, packageName: 'Monthly Boost', startDate: '2024-05-01', endDate: '2024-05-31', price: 1200000, status: 'Expired', createdAt: '2024-05-01', updatedAt: '2024-05-31' },
  { id: 3, boothId: 5, boothName: 'Broken Rice with Pork', boothOwner: 'Vo Minh Duc', promotionalPackageId: 2, packageName: 'Holiday Campaign', startDate: '2024-06-10', endDate: '2024-06-12', price: 800000, status: 'Scheduled', createdAt: '2024-06-05', updatedAt: '2024-06-05' },
  { id: 4, boothId: 8, boothName: 'Western Vietnamese Crepe', boothOwner: 'Bui Thi Giang', promotionalPackageId: 1, packageName: '7-Day Spotlight', startDate: '2024-05-20', endDate: '2024-05-26', price: 350000, status: 'Expired', createdAt: '2024-05-20', updatedAt: '2024-05-26' },
  { id: 5, boothId: 12, boothName: 'Bubble Tea', boothOwner: 'Ly Thi Lan', promotionalPackageId: 3, packageName: 'Monthly Boost', startDate: '2024-06-01', endDate: '2024-06-30', price: 1200000, status: 'Active', createdAt: '2024-06-01', updatedAt: '2024-06-01' },
];

// Notifications

export interface Notification {
  id: number;
  title: string;
  content: string;
  targetAudience: 'All' | 'Customers' | 'Booth Owners';
  status: 'Published' | 'Draft' | 'Scheduled';
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const notifications: Notification[] = [
  { id: 1, title: 'Welcome to Summer 2024!', content: 'Discover new booths and excitiK offers this summer. Hundreds of delicious street food options are waiting for you at night markets across the country!', targetAudience: 'All', status: 'Published', createdAt: '2024-06-01 08:00', updatedAt: '2024-06-01 08:00' },
  { id: 2, title: 'Scheduled System Maintenance', content: 'The platform will undergo maintenance from 2:00 AM - 4:00 AM on June 5, 2024. The app will be temporarily unavailable during this window. We apologize for any inconvenience.', targetAudience: 'All', status: 'Published', createdAt: '2024-06-03 14:00', updatedAt: '2024-06-03 14:00' },
  { id: 3, title: 'Special Offer for New Booths', content: 'Register a new booth in June and receive 1 free month of the Premium plan! A great opportunity to kickstart your business on the platform.', targetAudience: 'Booth Owners', status: 'Published', createdAt: '2024-06-01 09:00', updatedAt: '2024-06-01 09:00' },
  { id: 4, title: 'Payment Policy Update', content: 'Starting July 1, 2024, we will support additional payment methods including VNPAY, ZaloPay, and MoMo. Please update the app to access these new options.', targetAudience: 'All', status: 'Draft', createdAt: '2024-06-04 11:00', updatedAt: '2024-06-04 11:00' },
  { id: 5, title: 'Subscription Renewal Reminder', content: 'Your subscription plan expires in 7 days. Renew now to avoid service interruption and maintain your listing visibility on the platform.', targetAudience: 'Booth Owners', status: 'Scheduled', scheduledAt: '2024-06-07 08:00', createdAt: '2024-06-05 10:00', updatedAt: '2024-06-05 10:00' },
  { id: 6, title: 'User Experience Survey', content: 'Take 2 minutes to complete our app experience survey. Your feedback helps us improve the platform and deliver a better service to everyone.', targetAudience: 'Customers', status: 'Draft', createdAt: '2024-06-05 15:00', updatedAt: '2024-06-05 15:00' },
];
