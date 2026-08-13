import { useQuery } from '@tanstack/react-query';
import { fetchPersons } from '../api/personsApi';
import { personKeys } from '../api/personKeys';

export function personsQuery() {
	return {
		queryKey: personKeys.list(),
		queryFn: fetchPersons,
	};
}

export function usePersons() {
	return useQuery(personsQuery());
}
