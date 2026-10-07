import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { User } from '../../models/user';
import { UserApi } from '../../services/user-api';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule],
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
