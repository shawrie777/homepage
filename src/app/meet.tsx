/* eslint-disable @next/next/no-img-element */
import styles from "./meet.module.css"

export default function Meet() {
    return <a className={styles.meet} href="https://meet.google.com/jei-dbka-iiw">
        <img src="meet.png" alt="Google Meet"/>
    </a>
}