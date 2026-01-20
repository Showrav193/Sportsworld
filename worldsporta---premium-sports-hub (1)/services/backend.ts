
import { User, NewsArticle, MatchScore, Product, Order } from '../types';
import { INITIAL_NEWS, INITIAL_SCORES, INITIAL_PRODUCTS } from '../constants';

// Simulated latency to mimic a real network
const LATENCY = 300;

class BrowserBackend {
  private async delay() {
    return new Promise(resolve => setTimeout(resolve, LATENCY));
  }

  private getDB(): any {
    const data = localStorage.getItem('worldsporta_db');
    if (!data) {
      const initial = {
        news: INITIAL_NEWS,
        scores: INITIAL_SCORES,
        products: INITIAL_PRODUCTS,
        orders: [],
        users: [
          { id: '1', username: 'admin', email: 'admin@worldsporta.com', role: 'admin', isBlocked: false, createdAt: new Date().toISOString() }
        ]
      };
      localStorage.setItem('worldsporta_db', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  }

  private saveDB(db: any) {
    localStorage.setItem('worldsporta_db', JSON.stringify(db));
  }

  // News API
  async getNews(): Promise<NewsArticle[]> {
    await this.delay();
    return this.getDB().news;
  }

  async saveNews(news: NewsArticle[]): Promise<void> {
    await this.delay();
    const db = this.getDB();
    db.news = news;
    this.saveDB(db);
  }

  // Scores API
  async getScores(): Promise<MatchScore[]> {
    await this.delay();
    return this.getDB().scores;
  }

  async saveScores(scores: MatchScore[]): Promise<void> {
    await this.delay();
    const db = this.getDB();
    db.scores = scores;
    this.saveDB(db);
  }

  // Products API
  async getProducts(): Promise<Product[]> {
    await this.delay();
    return this.getDB().products;
  }

  async saveProducts(products: Product[]): Promise<void> {
    await this.delay();
    const db = this.getDB();
    db.products = products;
    this.saveDB(db);
  }

  // Orders API
  async getOrders(): Promise<Order[]> {
    await this.delay();
    return this.getDB().orders;
  }

  async placeOrder(order: Order): Promise<void> {
    await this.delay();
    const db = this.getDB();
    db.orders.unshift(order);
    this.saveDB(db);
  }

  // Users API
  async getUsers(): Promise<User[]> {
    await this.delay();
    return this.getDB().users;
  }

  async registerUser(user: User): Promise<void> {
    await this.delay();
    const db = this.getDB();
    db.users.push(user);
    this.saveDB(db);
  }

  async blockUser(userId: string, isBlocked: boolean): Promise<void> {
    await this.delay();
    const db = this.getDB();
    db.users = db.users.map((u: User) => u.id === userId ? { ...u, isBlocked } : u);
    this.saveDB(db);
  }
}

export const api = new BrowserBackend();
