"""OptoJump Windows companion. No device control, only exported XML imports."""
import json
import os
import queue
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
from pathlib import Path
from cloud_client import CloudClient
from watcher import FolderWatcher
from optojump_parser import parse_export

STATE = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "HyperKidsOptoJump"
STATE.mkdir(parents=True, exist_ok=True)
CONFIG = STATE / "settings.json"

class App:
    def __init__(self, root):
        self.root = root
        root.title("HyperKids · OptoJump")
        root.geometry("760x560")
        root.minsize(650, 500)
        self.cloud = CloudClient()
        self.events = queue.Queue()
        self.stop = threading.Event()
        self.busy = False
        self.closed = False
        self.settings = json.loads(CONFIG.read_text(encoding="utf-8")) if CONFIG.exists() else {"folder": "", "mappings": {}}
        self.folder = tk.StringVar(value=self.settings.get("folder", ""))
        self.status = tk.StringVar(value="Δεν έχει γίνει σύνδεση")
        frame = ttk.Frame(root, padding=20)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="OptoJump", font=("Segoe UI", 22, "bold")).pack(anchor="w")
        ttk.Label(frame, textvariable=self.status).pack(anchor="w", pady=(0, 16))
        self.login_button = ttk.Button(frame, text="Σύνδεση admin", command=self.login)
        self.login_button.pack(anchor="w")
        ttk.Label(frame, text="Φάκελος XML").pack(anchor="w", pady=(16, 4))
        row = ttk.Frame(frame)
        row.pack(fill="x")
        ttk.Entry(row, textvariable=self.folder, state="readonly").pack(side="left", fill="x", expand=True)
        self.folder_button = ttk.Button(row, text="Επιλογή φακέλου", command=self.choose_folder)
        self.folder_button.pack(side="left", padx=(8, 0))
        actions = ttk.Frame(frame)
        actions.pack(fill="x", pady=16)
        self.mapping_button = ttk.Button(actions, text="Αντιστοίχιση χρήστη", command=self.map_user)
        self.mapping_button.pack(side="left")
        self.start_button = ttk.Button(actions, text="Έναρξη μεταφοράς", command=self.start)
        self.start_button.pack(side="left", padx=8)
        ttk.Button(actions, text="Παύση", command=self.pause).pack(side="left")
        self.logout_button = ttk.Button(actions, text="Αποσύνδεση", command=self.logout)
        self.logout_button.pack(side="right")
        self.log = tk.Text(frame, height=12, wrap="word", state="disabled", font=("Segoe UI", 10))
        self.log.pack(fill="both", expand=True)
        root.protocol("WM_DELETE_WINDOW", self.close)
        root.after(150, self.process_events)
        self.task(self.cloud.restore, lambda restored: self.status.set("Συνδεδεμένος admin" if restored else "Δεν έχει γίνει σύνδεση"))

    def append(self, text):
        self.log.configure(state="normal")
        self.log.insert("end", text + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    def save(self):
        temp = CONFIG.with_suffix(".tmp")
        temp.write_text(json.dumps(self.settings, ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(CONFIG)

    def task(self, work, done):
        if self.busy:
            return
        self.busy = True
        def run():
            try:
                self.events.put(("done", (done, work())))
            except Exception as error:
                self.events.put(("error", str(error)))
        threading.Thread(target=run, daemon=True).start()

    def process_events(self):
        while not self.events.empty():
            kind, value = self.events.get()
            if kind == "done":
                self.busy = False
                done, result = value
                done(result)
            elif kind == "error":
                self.busy = False
                self.append(value)
                self.status.set("Απαιτείται έλεγχος")
            elif kind == "watch":
                for status, detail in value:
                    if status == "unmapped":
                        self.append("Χρειάζεται αντιστοίχιση: " + self.person_label(detail))
                    elif status == "unsupported":
                        self.append("Δεν εισάγεται ακόμη: " + detail)
                    elif status == "invalid":
                        self.append("Μη έγκυρο XML, δεν εισάγεται: " + detail)
                    else:
                        self.append(("Αποθηκεύτηκε: " if status == "imported" else "Ήδη αποθηκευμένο: ") + detail)
            elif kind == "watch_error":
                self.append(value)
                self.status.set("Αναμονή · θα ξαναδοκιμάσουμε")
            elif kind == "stopped":
                self.start_button.configure(state="normal")
                for button in (self.mapping_button, self.folder_button, self.logout_button, self.login_button):
                    button.configure(state="normal")
                self.status.set("Σε παύση")
        if not self.closed:
            self.root.after(150, self.process_events)

    @staticmethod
    def person_label(person):
        external_id, last, first, birth = json.loads(person)
        return last + " " + first + " · " + birth + (" · " + external_id if external_id else "")

    def login(self):
        if self.busy:
            return
        dialog = tk.Toplevel(self.root)
        dialog.title("Σύνδεση admin")
        dialog.transient(self.root)
        dialog.grab_set()
        content = ttk.Frame(dialog, padding=20)
        content.pack()
        ttk.Label(content, text="Email").pack(anchor="w")
        email = ttk.Entry(content, width=40)
        email.pack(pady=4)
        ttk.Label(content, text="Κωδικός").pack(anchor="w")
        password = ttk.Entry(content, show="•", width=40)
        password.pack(pady=4)
        def submit():
            e, secret = email.get(), password.get()
            password.delete(0, "end")
            dialog.destroy()
            self.status.set("Γίνεται σύνδεση…")
            self.task(lambda: self.cloud.login(e, secret), lambda _: self.status.set("Συνδεδεμένος admin"))
        ttk.Button(content, text="Σύνδεση", command=submit).pack(pady=8)

    def choose_folder(self):
        folder = filedialog.askdirectory()
        if folder:
            self.folder.set(folder)
            self.settings["folder"] = folder
            self.save()

    def map_user(self):
        if self.busy or not self.cloud.session:
            messagebox.showinfo("OptoJump", "Συνδέσου πρώτα ως admin.")
            return
        path = filedialog.askopenfilename(filetypes=[("OptoJump XML", "*.xml")], initialdir=self.folder.get() or None)
        if not path:
            return
        try:
            attempts, _ = parse_export(Path(path).read_bytes())
        except Exception as error:
            messagebox.showerror("OptoJump", str(error))
            return
        people = sorted(set(a["external_person"] for a in attempts))
        if not people:
            messagebox.showinfo("OptoJump", "Δεν υπάρχουν υποστηριζόμενα τεστ σε αυτό το αρχείο.")
            return
        dialog = tk.Toplevel(self.root)
        dialog.title("Αντιστοίχιση χρήστη")
        dialog.transient(self.root)
        dialog.grab_set()
        frame = ttk.Frame(dialog, padding=20)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="Χρήστης OptoJump").pack(anchor="w")
        selected = ttk.Combobox(frame, state="readonly", values=[self.person_label(v) for v in people], width=55)
        selected.current(0)
        selected.pack(pady=8)
        ttk.Label(frame, text="Email χρήστη στην πλατφόρμα").pack(anchor="w")
        email = ttk.Entry(frame, width=55)
        email.pack(pady=8)
        def submit():
            person = people[selected.current()]
            value = email.get().strip()
            dialog.destroy()
            def confirm(user):
                if messagebox.askyesno("Επιβεβαίωση αντιστοίχισης", self.person_label(person) + "\n→ " + user["name"] + " · " + user["email"]):
                    self.settings.setdefault("mappings", {})[person] = user["id"]
                    self.save()
                    self.append("Αποθηκεύτηκε αντιστοίχιση: " + user["name"])
            self.task(lambda: self.cloud.lookup(value), confirm)
        ttk.Button(frame, text="Εύρεση χρήστη", command=submit).pack(pady=8)

    def start(self):
        if self.busy or not self.cloud.session:
            messagebox.showinfo("OptoJump", "Συνδέσου πρώτα ως admin.")
            return
        folder = self.folder.get()
        if not Path(folder).is_dir():
            messagebox.showinfo("OptoJump", "Επίλεξε τον φάκελο εξαγωγής XML.")
            return
        if not self.settings.get("mappings"):
            messagebox.showinfo("OptoJump", "Αντιστοίχισε πρώτα έναν χρήστη.")
            return
        if not messagebox.askyesno("Έναρξη μεταφοράς", "Θα μεταφερθούν και τα παλαιότερα υποστηριζόμενα τεστ του φακέλου για τους αντιστοιχισμένους χρήστες. Συνέχεια;"):
            return
        self.stop.clear()
        self.start_button.configure(state="disabled")
        for button in (self.mapping_button, self.folder_button, self.logout_button, self.login_button):
            button.configure(state="disabled")
        self.status.set("Παρακολουθείται ο φάκελος")
        mappings = dict(self.settings["mappings"])
        def run():
            watcher = FolderWatcher(STATE, self.cloud)
            last = None
            try:
                while not self.stop.is_set():
                    try:
                        results = watcher.scan(folder, mappings)
                        if results and results != last:
                            self.events.put(("watch", results))
                        last = results
                    except Exception as error:
                        text = str(error)
                        if text != last:
                            self.events.put(("watch_error", text))
                        last = text
                    self.stop.wait(3)
            finally:
                watcher.db.close()
                self.events.put(("stopped", None))
        threading.Thread(target=run, daemon=True).start()

    def pause(self):
        self.stop.set()
        self.status.set("Ολοκληρώνεται η τρέχουσα αποστολή…")

    def logout(self):
        if self.busy:
            return
        self.task(self.cloud.logout, lambda _: self.status.set("Δεν έχει γίνει σύνδεση"))

    def close(self):
        self.closed = True
        self.stop.set()
        self.root.destroy()

if __name__ == "__main__":
    App(tk.Tk()).root.mainloop()
