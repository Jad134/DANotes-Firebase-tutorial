import { Injectable, inject } from '@angular/core';
import { Note } from '../interfaces/note.interface'
import { Firestore, query, collection, doc, collectionData, onSnapshot, addDoc, updateDoc, deleteDoc, orderBy, limit, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { state } from '@angular/animations';


@Injectable({
  providedIn: 'root'
})
export class NoteListService {

  trashNotes: Note[] = [];
  normalNotes: Note[] = [];
  normalMarkedNotes: Note[] = [];

  unsubTrash: any;
  unsubNotes: any;
  unsubMarkedNotes: any;

  firestore: Firestore = inject(Firestore);


  constructor() {
    this.unsubNotes = this.subNotesList();
    this.unsubMarkedNotes = this.subMarkedNotesList();
    this.unsubTrash = this.subTrashList();
  }
  //  const itemCollection = collection(this.firestore, 'items');


  async deleteNote(colId: 'Notes' | 'trash', docId: string) {
    await deleteDoc(this.getSingleDocRef(colId, docId)).catch(
      (err) => { console.log(err) }
    );

  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id);
      await updateDoc(docRef, this.getCleanJson(note)).catch(
        (err) => { console.log(err); }
      );

    }
  }

  getCleanJson(note: Note): {} {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked,
    }
  }

  getColIdFromNote(note: Note) {
    if (note.type == 'note') {
      return 'Notes'
    } else {
      return 'trash'
    }
  }

  async addNote(item: Note, colId: "Notes" | 'trash') {
    if (colId == "Notes") {
      await addDoc(this.getNotesRef(), item).catch(
        (err) => { console.error(err) }
      ).then(
        (docRef) => { console.log("Document written with ID: ", docRef?.id); }
      )
    } else if(colId == "trash"){
      await addDoc(this.getTrashRef(), item).catch(
        (err) => { console.error(err) }
      ).then(
        (docRef) => { console.log("Document written with ID: ", docRef?.id); }
      )
    }

  }

  ngonDestroy() {
    this.unsubNotes();
    this.unsubTrash();
    this.unsubMarkedNotes();
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = []
      list.forEach(element => {
        this.trashNotes.push(this.setNoteObject(element.data(), element.id))
      })
    });

  }

  subNotesList() {

    // let ref = collection(this.firestore, "Notes/1eeyH5B6xy5FZK4nfOau/Notes-Extra");
    // const q = query(ref,  limit(100));
    // Damit kann man auch auf weitere Unterordner zugreifen. Dazu einfach das q bei onsnapshot entfernen und ref nutzen .

    const q = query(this.getNotesRef(),  limit(100));
    return onSnapshot(q, (list) => {
      this.normalNotes = []
      list.forEach(element => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id))
      });
      list.docChanges().forEach((change) => {
        if (change.type === "added") {
            console.log("New note: ", change.doc.data());
        }
        if (change.type === "modified") {
            console.log("Modified note: ", change.doc.data());
        }
        if (change.type === "removed") {
            console.log("Removed note: ", change.doc.data());
        }
      });
    });
    
  }

  subMarkedNotesList() {
    const q = query(this.getNotesRef(), where("marked","==",true),  limit(100));
    return onSnapshot(q, (list) => {
      this.normalMarkedNotes = []
      list.forEach(element => {
        this.normalMarkedNotes.push(this.setNoteObject(element.data(), element.id))
      })
    });
  }

  getNotesRef() {
    return collection(this.firestore, 'Notes');
  }

  getTrashRef() {
    return collection(this.firestore, 'trash');
  }

  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id,
      type: obj.type || "note",
      title: obj.title || "",
      content: obj.content || "",
      marked: obj.marked || false,
    }

  }
}
