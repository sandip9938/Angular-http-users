import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { User } from '../../models/user';
import { UserApi } from '../../services/user-api';

@Component({
  selector: 'app-user-details',
  imports: [RouterLink],
  templateUrl: './user-details.html',
  styleUrl: './user-details.css',
})
export class UserDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly userApi = inject(UserApi);

  user = signal<User | null>(null);
  loading = signal(true);
  error = signal('');

  getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  websiteUrl(website: string): string {
    return /^https?:\/\//i.test(website) ? website : `https://${website}`;
  }

  ngOnInit(): void {
    const userId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(userId) || userId < 1) {
      this.error.set('Invalid user ID.');
      this.loading.set(false);
      return;
    }

    this.userApi.getUserDetails(userId).subscribe({
      next: (user) => {
        if (!user.name) {
          this.error.set('User not found.');
        } else {
          this.user.set(user);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('GET user details failed:', error);
        this.error.set('Could not load user details.');
        this.loading.set(false);
      },
    });
  }
}
