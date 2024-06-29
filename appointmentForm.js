import { LightningElement, track, wire } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveAppointmentSlots from '@salesforce/apex/AppointmentController.getActiveAppointmentSlots';

export default class AppointmentForm extends LightningElement {

        @track appointmentSlots;
        selectedDateTime;
        error;



    @wire(getActiveAppointmentSlots)
    wiredAppointmentSlots({ error, data }) {
        if (data) {
            this.appointmentSlots = data;
            this.error = undefined;

        } else if (error) {
             this.error = error;
            this.appointmentSlots = undefined;
            console.error('Error fetching appointment slots:', error);
        }
    }

    handleDateTimeChange(event) {
        debugger;
        this.selectedDateTime = event.target.value;
         this.validateDateTime();

    }
       
    validateDateTime() {
        if (this.appointmentSlots && this.selectedDateTime) {
            const selectedTime = new Date(this.selectedDateTime).getTime();

            // Check for duplicate date/time selections
            const duplicateFound = this.appointmentSlots.some(slot => {
                const slotTime = new Date(slot.DateTime__c).getTime();
                return slotTime === selectedTime;
            });

            if (duplicateFound) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'This date and time is already selected for another appointment.',
                        variant: 'error'
                    })
                );
                this.selectedDateTime = undefined; 
                return;
            }

            // Check if selected appointment time falls within available time slots
            // Assuming appointmentSlots is sorted in ascending order
            const validSlot = this.appointmentSlots.some(slot => {
                const slotTime = new Date(slot.DateTime__c).getTime();
                return slotTime === selectedTime;
            });

            if (!validSlot) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'success',
                        message: '',
                        variant: 'success'
                    })
                );
                this.selectedDateTime = undefined; 
            }
        }
    }




       handleSubmit(event){
           event.preventDefault();
        const fields = event.detail.fields;
     createRecord({ apiName: 'Appointment_Details__c', fields })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Appointment created successfully',
                        variant: 'success'
                    })
                );
                this.template.querySelector('lightning-record-edit-form').reset();
            })
            .catch(error => {
                console.error('Error creating appointment:', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating appointment',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }

    

}
