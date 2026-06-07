import styles from "./search.module.css"

export default function Search() {
  	return <form action="https://www.google.com/search" method="get" className={styles.google}>
  	<input type="text" name="q" placeholder="Search Google..." autoFocus/>
</form>
}