import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { NewUser, User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';
  private readonly localUsers = new Map<number, User>();
  private readonly deletedUserIds = new Set<number>();
  private nextLocalUserId = 1001;

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      map((users) => {
        const serverUsers = users
          .filter((user) => user.id !== undefined && !this.deletedUserIds.has(user.id))
          .map((user) => this.localUsers.get(user.id!) ?? user);
        const serverUserIds = new Set(serverUsers.map((user) => user.id));
        const locallyAddedUsers = [...this.localUsers.values()].filter(
          (user) => user.id !== undefined && !serverUserIds.has(user.id),
        );
        return [...locallyAddedUsers, ...serverUsers];
      }),
    );
  }

  addUser(user: NewUser): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      map((createdUser) => {
        const localUser = { ...createdUser, ...user, id: this.nextLocalUserId++ };
        this.localUsers.set(localUser.id, localUser);
        return localUser;
      }),
    );
  }

  getUserDetails(userId: number): Observable<User> {
    const localUser = this.localUsers.get(userId);
    if (localUser) {
      return of(localUser);
    }

    const url = `${this.apiUrl}/${userId}`;
    return this.http.get<User>(url);
  }

  replaceUser(userId: number, user: NewUser): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, user).pipe(
      map((updatedUser) => {
        const result = { ...updatedUser, ...user, id: userId };
        this.localUsers.set(userId, result);
        this.deletedUserIds.delete(userId);
        return result;
      }),
    );
  }

  updateUser(userId: number, updates: Partial<NewUser>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}`, updates).pipe(
      map((updatedUser) => {
        const result = { ...updatedUser, ...this.localUsers.get(userId), ...updates, id: userId };
        this.localUsers.set(userId, result);
        this.deletedUserIds.delete(userId);
        return result;
      }),
    );
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`).pipe(
      map(() => {
        this.localUsers.delete(userId);
        this.deletedUserIds.add(userId);
      }),
    );
  }
}
