import { v4 as uuidv4 } from 'uuid';

export enum ContactStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export interface CreateContactDTO {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  tags?: string[];
  status?: ContactStatus;
  isFavorite?: boolean;
}

export interface UpdateContactDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  tags?: string[];
  status?: ContactStatus;
  isFavorite?: boolean;
}

export class Contact {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  tags: string[];
  status: ContactStatus;
  isFavorite: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(data: CreateContactDTO) {
    if (data.email) {
      this.validateEmail(data.email);
    }
    if (data.phone) {
      this.validatePhone(data.phone);
    }

    this.id = uuidv4();
    this.userId = data.userId;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email?.toLowerCase();
    this.phone = data.phone;
    this.company = data.company;
    this.jobTitle = data.jobTitle;
    this.addressLine1 = data.addressLine1;
    this.addressLine2 = data.addressLine2;
    this.city = data.city;
    this.state = data.state;
    this.postalCode = data.postalCode;
    this.country = data.country;
    this.notes = data.notes;
    this.tags = data.tags || [];
    this.status = data.status || ContactStatus.ACTIVE;
    this.isFavorite = data.isFavorite || false;
    this.metadata = {};
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  private validatePhone(phone: string): void {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone format');
    }
  }

  update(data: UpdateContactDTO): void {
    if (data.email !== undefined) {
      if (data.email) {
        this.validateEmail(data.email);
      }
      this.email = data.email?.toLowerCase();
    }

    if (data.phone !== undefined) {
      if (data.phone) {
        this.validatePhone(data.phone);
      }
      this.phone = data.phone;
    }

    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
    if (data.company !== undefined) this.company = data.company;
    if (data.jobTitle !== undefined) this.jobTitle = data.jobTitle;
    if (data.addressLine1 !== undefined) this.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined) this.addressLine2 = data.addressLine2;
    if (data.city !== undefined) this.city = data.city;
    if (data.state !== undefined) this.state = data.state;
    if (data.postalCode !== undefined) this.postalCode = data.postalCode;
    if (data.country !== undefined) this.country = data.country;
    if (data.notes !== undefined) this.notes = data.notes;
    if (data.tags !== undefined) this.tags = data.tags;
    if (data.status !== undefined) this.status = data.status;
    if (data.isFavorite !== undefined) this.isFavorite = data.isFavorite;

    this.updatedAt = new Date();
  }

  archive(): void {
    this.status = ContactStatus.ARCHIVED;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.status = ContactStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = ContactStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updatedAt = new Date();
  }

  getMetadata(key: string): any {
    return this.metadata[key];
  }

  removeMetadata(key: string): void {
    delete this.metadata[key];
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getSearchString(): string {
    const parts = [
      this.firstName,
      this.lastName,
      this.email,
      this.phone,
      this.company,
      this.jobTitle,
      this.notes,
      ...this.tags,
    ].filter(Boolean);

    return parts.join(' ').toLowerCase();
  }

  toJSON(): any {
    return {
      ...this,
      fullName: this.getFullName(),
    };
  }
}
