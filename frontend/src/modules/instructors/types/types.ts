/** Mirror of the backend's `ContractType` */
export type ContractType = 'OPEN' | 'TOURNAMENT';


/**
 * Mirror of the backend's `InstructorView`.
 */
export interface InstructorView {
	id: string;
	name: string;
	lastName: string;
	fullName: string;
	costPerHour: number;
	contractSignedDate: string | null;
	contractNumber: string | null;
	contractType: ContractType;
	active: boolean;
	note: string | null;
}
