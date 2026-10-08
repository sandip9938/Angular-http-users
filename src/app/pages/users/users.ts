import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { User } from '../../models/user';
import { UserApi } from '../../services/user-api';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private readonly userApi = inject(UserApi);
  private readonly fb = inject(FormBuilder);


  users = signal<User[]>([]);
  loading = signal(false);
  submitting = signal(false);
  apiError = signal('');
  editingUser = signal<User | null>(null);

  userForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit(): void {
    this.loadUsers();
  }


  loadUsers(): void {
    this.loading.set(true);
    this.apiError.set('');

    this.userApi.getAllUsers().subscribe({
      next: (response) => {
        this.users.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('GET users failed:', error);
        this.apiError.set('Could not load users.');
        this.loading.set(false);
      },
    });
  }

  addUser(): void {
    if (this.editingUser()) {
      this.apiError.set('Finish or cancel the current edit before adding a user.');
      return;
    }

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.apiError.set('');

    this.userApi.addUser(this.userForm.getRawValue()).subscribe({
      next: (createdUser) => {
        this.users.update((list) => [createdUser, ...list]);
        this.userForm.reset({
          name: '',
          email: '',
          phone: '',
        });
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('POST user failed:', error);
        this.apiError.set('Could not add the user.');
        this.submitting.set(false);
      },
    });
  }

  editUser(user: User): void {
    if (user.id === undefined) {
      this.apiError.set('Cannot edit a user without an ID.');
      return;
    }

    this.editingUser.set(user);
    this.apiError.set('');
    this.userForm.setValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingUser.set(null);
    this.resetForm();
  }

  replaceUser(): void {
    const user = this.editingUser();
    if (!user || user.id === undefined || !this.validateForm()) {
      return;
    }

    this.submitting.set(true);
    this.apiError.set('');
    this.userApi.replaceUser(user.id, this.userForm.getRawValue()).subscribe({
      next: (updatedUser) => {
        this.users.update((list) => list.map((item) => item.id === updatedUser.id ? updatedUser : item));
        this.editingUser.set(null);
        this.resetForm();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('PUT user failed:', error);
        this.apiError.set('Could not replace the user.');
        this.submitting.set(false);
      },
    });
  }

  patchUser(): void {
    const user = this.editingUser();
    if (!user || user.id === undefined || !this.validateForm()) {
      return;
    }

    const formValue = this.userForm.getRawValue();
    const updates = {
      ...(formValue.name !== user.name && { name: formValue.name }),
      ...(formValue.email !== user.email && { email: formValue.email }),
      ...(formValue.phone !== user.phone && { phone: formValue.phone }),
    };

    if (Object.keys(updates).length === 0) {
      this.apiError.set('Change at least one field before using partial update.');
      return;
    }

    this.submitting.set(true);
    this.apiError.set('');
    this.userApi.updateUser(user.id, updates).subscribe({
      next: (updatedUser) => {
        this.users.update((list) => list.map((item) => item.id === updatedUser.id ? updatedUser : item));
        this.editingUser.set(null);
        this.resetForm();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('PATCH user failed:', error);
        this.apiError.set('Could not partially update the user.');
        this.submitting.set(false);
      },
    });
  }

  deleteUser(user: User): void {
    if (user.id === undefined) {
      this.apiError.set('Cannot delete a user without an ID.');
      return;
    }
    if (!window.confirm(`Delete ${user.name}?`)) {
      return;
    }

    this.apiError.set('');
    this.userApi.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((item) => item.id !== user.id));
        if (this.editingUser()?.id === user.id) {
          this.cancelEdit();
        }
      },
      error: (error) => {
        console.error('DELETE user failed:', error);
        this.apiError.set('Could not delete the user.');
      },
    });
  }

  private validateForm(): boolean {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return false;
    }
    return true;
  }

  private resetForm(): void {
    this.userForm.reset({ name: '', email: '', phone: '' });
  }

  get name() {
    return this.userForm.controls.name;
  }

  get email() {
    return this.userForm.controls.email;
  }

  get phone() {
    return this.userForm.controls.phone;
  }
}
